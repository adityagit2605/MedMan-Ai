package com.healthcare.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Distributed lock for slot-hold mechanism using Redis SET NX PX.
 *
 * This is the FAST PATH for double-booking prevention (see LLD §2.3):
 *   1. Patient clicks "book" → RedisLockService.acquireLock() tries SET NX PX
 *   2. If lock acquired → proceed to DB insert (held)
 *   3. If lock NOT acquired → immediately return 409 (no DB roundtrip needed)
 *
 * The DB-level partial unique index is the second guard (belt-and-braces).
 *
 * Lock key format: slot:lock:{doctorId}:{date}:{startTime}
 * Lock TTL: configurable, default 5 seconds (just long enough to complete the DB insert).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisLockService {

    private final StringRedisTemplate redisTemplate;

    @Value("${app.slot.redis.lock.ttl.ms}")
    private long lockTtlMs;

    /**
     * Try to acquire a distributed lock for a specific slot.
     *
     * @return true if lock was acquired (proceed with booking), false if slot is taken
     */
    public boolean acquireLock(UUID doctorId, LocalDate date, LocalTime startTime) {
        String lockKey   = buildLockKey(doctorId, date, startTime);
        String lockValue = UUID.randomUUID().toString(); // unique per attempt

        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, Duration.ofMillis(lockTtlMs));

        if (Boolean.TRUE.equals(acquired)) {
            log.info("Redis lock acquired: {}", lockKey);
            return true;
        }

        log.info("Redis lock DENIED (slot taken): {}", lockKey);
        return false;
    }

    /**
     * Release the lock after the DB transaction completes.
     * Idempotent — safe to call even if lock already expired.
     */
    public void releaseLock(UUID doctorId, LocalDate date, LocalTime startTime) {
        String lockKey = buildLockKey(doctorId, date, startTime);
        redisTemplate.delete(lockKey);
        log.info("Redis lock released: {}", lockKey);
    }

    /**
     * Build a deterministic lock key for a slot.
     * Format: slot:lock:{doctorId}:{YYYY-MM-DD}:{HH:mm}
     */
    private String buildLockKey(UUID doctorId, LocalDate date, LocalTime startTime) {
        return String.format("slot:lock:%s:%s:%s",
                doctorId.toString(),
                date.toString(),
                startTime.toString());
    }
}
