package com.healthcare.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.Executor;

/**
 * Async thread pool for off-critical-path operations:
 *   - LLM pre-visit / post-visit calls (8s+ latency)
 *   - Notification queueing
 *
 * Core pool: 4 threads, max: 8 — sized for a typical single-instance deployment.
 * Queue capacity: 50 — if exceeded, the caller thread runs the task (CallerRunsPolicy).
 */
@Configuration
public class AsyncConfig implements AsyncConfigurer {

    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("async-");
        executor.initialize();
        return executor;
    }

    /**
     * RestTemplate bean for synchronous HTTP calls to the Python LLM service.
     * Used inside @Async methods so the main request thread is never blocked.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
