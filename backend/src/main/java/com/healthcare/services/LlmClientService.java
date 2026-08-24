package com.healthcare.services;

import com.healthcare.models.SymptomForm;
import com.healthcare.models.VisitNote;
import com.healthcare.repositories.SymptomFormRepository;
import com.healthcare.repositories.VisitNoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Async bridge between the Java backend and the Python LLM microservice.
 *
 * Key design principle (LLD §2.5):
 *   - LLM calls are ASYNC, OFF THE CRITICAL BOOKING PATH
 *   - Booking success NEVER depends on LLM success
 *   - On failure → llm_status='FAILED', doctor sees raw symptoms/notes
 *
 * The @Async annotation ensures these methods run on the background
 * thread pool (configured in AsyncConfig) and do not block the
 * controller response to the patient.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LlmClientService {

    private final RestTemplate          restTemplate;
    private final SymptomFormRepository symptomFormRepo;
    private final VisitNoteRepository   visitNoteRepo;

    @Value("${app.llm.service.url}")
    private String llmServiceUrl;

    // ═══════════════════════════════════════════════════════════════════════
    //  PRE-VISIT SUMMARY (triggered on booking confirmation)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Call the Python LLM service to analyse symptoms.
     * Updates the SymptomForm row with urgency, chief complaint, questions.
     *
     * Runs asynchronously — the patient's confirm response has already returned.
     */
    @Async("taskExecutor")
    public void generatePreVisitSummary(UUID symptomFormId) {
        log.info("Async LLM pre-visit call started for symptomForm={}", symptomFormId);

        SymptomForm form = symptomFormRepo.findById(symptomFormId).orElse(null);
        if (form == null) {
            log.warn("SymptomForm not found: {}", symptomFormId);
            return;
        }

        try {
            String url = llmServiceUrl + "/api/llm/pre-visit-summary";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = Map.of("symptoms", form.getSymptomsRaw());
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                String llmStatus = (String) result.getOrDefault("llm_status", "FAILED");

                if ("SUCCESS".equals(llmStatus)) {
                    // Parse and save LLM results
                    String urgency = (String) result.getOrDefault("urgency_level", "MEDIUM");
                    String complaint = (String) result.getOrDefault("chief_complaint", "");
                    Object questionsObj = result.get("suggested_questions");

                    form.setUrgencyLevel(parseUrgency(urgency));
                    form.setChiefComplaint(complaint);

                    if (questionsObj instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<String> questions = (List<String>) questionsObj;
                        form.setSuggestedQuestions(questions);
                    }

                    form.setLlmStatus(SymptomForm.LlmStatus.SUCCESS);
                    log.info("Pre-visit summary SUCCESS: urgency={}, symptomForm={}",
                            urgency, symptomFormId);
                } else {
                    form.setLlmStatus(SymptomForm.LlmStatus.FAILED);
                    log.warn("Pre-visit summary FAILED (LLM returned failure): symptomForm={}",
                            symptomFormId);
                }
            } else {
                form.setLlmStatus(SymptomForm.LlmStatus.FAILED);
                log.warn("Pre-visit summary FAILED (non-2xx response): symptomForm={}",
                        symptomFormId);
            }

        } catch (Exception e) {
            form.setLlmStatus(SymptomForm.LlmStatus.FAILED);
            log.error("Pre-visit summary FAILED (exception): symptomForm={}, error={}",
                    symptomFormId, e.getMessage());
        }

        symptomFormRepo.save(form);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  POST-VISIT SUMMARY (triggered on doctor notes submission)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Call the Python LLM service to generate a patient-friendly summary
     * of the doctor's clinical notes.
     *
     * Runs asynchronously — the doctor's submit-notes response has already returned.
     */
    @Async("taskExecutor")
    public void generatePostVisitSummary(UUID visitNoteId) {
        log.info("Async LLM post-visit call started for visitNote={}", visitNoteId);

        VisitNote note = visitNoteRepo.findById(visitNoteId).orElse(null);
        if (note == null) {
            log.warn("VisitNote not found: {}", visitNoteId);
            return;
        }

        try {
            String url = llmServiceUrl + "/api/llm/post-visit-summary";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = Map.of("notes", note.getClinicalNotes());
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                String llmStatus = (String) result.getOrDefault("llm_status", "FAILED");

                if ("SUCCESS".equals(llmStatus)) {
                    String summary = (String) result.getOrDefault("patient_summary", "");
                    note.setPatientSummary(summary);
                    note.setLlmStatus(VisitNote.LlmStatus.SUCCESS);
                    log.info("Post-visit summary SUCCESS: visitNote={}", visitNoteId);
                } else {
                    note.setLlmStatus(VisitNote.LlmStatus.FAILED);
                    log.warn("Post-visit summary FAILED (LLM returned failure): visitNote={}",
                            visitNoteId);
                }
            } else {
                note.setLlmStatus(VisitNote.LlmStatus.FAILED);
            }

        } catch (Exception e) {
            note.setLlmStatus(VisitNote.LlmStatus.FAILED);
            log.error("Post-visit summary FAILED (exception): visitNote={}, error={}",
                    visitNoteId, e.getMessage());
        }

        visitNoteRepo.save(note);
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private SymptomForm.UrgencyLevel parseUrgency(String urgency) {
        try {
            return SymptomForm.UrgencyLevel.valueOf(urgency.toUpperCase());
        } catch (IllegalArgumentException e) {
            return SymptomForm.UrgencyLevel.MEDIUM;
        }
    }
}
