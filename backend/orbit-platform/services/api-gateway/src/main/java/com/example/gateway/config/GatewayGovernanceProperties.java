package com.example.gateway.config;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gateway.governance")
public class GatewayGovernanceProperties {
    private String contractsConfig;
    private String policiesConfig;
    private String aggregationConfig;
    private String clientProfilesConfig;
    private List<RouteContractDefinition> contracts = new ArrayList<>();
    private List<PolicySetDefinition> policies = new ArrayList<>();
    private List<AggregationRecipeDefinition> aggregationRecipes = new ArrayList<>();
    private List<ClientProfileDefinition> clientProfiles = new ArrayList<>();

    public String getContractsConfig() {
        return contractsConfig;
    }

    public void setContractsConfig(String contractsConfig) {
        this.contractsConfig = contractsConfig;
    }

    public String getPoliciesConfig() {
        return policiesConfig;
    }

    public void setPoliciesConfig(String policiesConfig) {
        this.policiesConfig = policiesConfig;
    }

    public String getAggregationConfig() {
        return aggregationConfig;
    }

    public void setAggregationConfig(String aggregationConfig) {
        this.aggregationConfig = aggregationConfig;
    }

    public String getClientProfilesConfig() {
        return clientProfilesConfig;
    }

    public void setClientProfilesConfig(String clientProfilesConfig) {
        this.clientProfilesConfig = clientProfilesConfig;
    }

    public List<RouteContractDefinition> getContracts() {
        return contracts;
    }

    public void setContracts(List<RouteContractDefinition> contracts) {
        this.contracts = contracts;
    }

    public List<PolicySetDefinition> getPolicies() {
        return policies;
    }

    public void setPolicies(List<PolicySetDefinition> policies) {
        this.policies = policies;
    }

    public List<AggregationRecipeDefinition> getAggregationRecipes() {
        return aggregationRecipes;
    }

    public void setAggregationRecipes(List<AggregationRecipeDefinition> aggregationRecipes) {
        this.aggregationRecipes = aggregationRecipes;
    }

    public List<ClientProfileDefinition> getClientProfiles() {
        return clientProfiles;
    }

    public void setClientProfiles(List<ClientProfileDefinition> clientProfiles) {
        this.clientProfiles = clientProfiles;
    }

    public static class RouteContractDefinition {
        private String id;
        private String routeKey;
        private String owner;
        private String slaTarget;
        private String status;
        private List<RouteContractVersionDefinition> versions = new ArrayList<>();

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getRouteKey() {
            return routeKey;
        }

        public void setRouteKey(String routeKey) {
            this.routeKey = routeKey;
        }

        public String getOwner() {
            return owner;
        }

        public void setOwner(String owner) {
            this.owner = owner;
        }

        public String getSlaTarget() {
            return slaTarget;
        }

        public void setSlaTarget(String slaTarget) {
            this.slaTarget = slaTarget;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public List<RouteContractVersionDefinition> getVersions() {
            return versions;
        }

        public void setVersions(List<RouteContractVersionDefinition> versions) {
            this.versions = versions;
        }
    }

    public static class RouteContractVersionDefinition {
        private String version;
        private String status;
        private Instant deprecationDate;
        private String responseSchemaRef;

        public String getVersion() {
            return version;
        }

        public void setVersion(String version) {
            this.version = version;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Instant getDeprecationDate() {
            return deprecationDate;
        }

        public void setDeprecationDate(Instant deprecationDate) {
            this.deprecationDate = deprecationDate;
        }

        public String getResponseSchemaRef() {
            return responseSchemaRef;
        }

        public void setResponseSchemaRef(String responseSchemaRef) {
            this.responseSchemaRef = responseSchemaRef;
        }
    }

    public static class PolicySetDefinition {
        private String id;
        private String name;
        private RateLimitDefinition rateLimit;
        private ResilienceDefinition resilience;
        private RolloutDefinition rollout;
        private String cachePolicy;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public RateLimitDefinition getRateLimit() {
            return rateLimit;
        }

        public void setRateLimit(RateLimitDefinition rateLimit) {
            this.rateLimit = rateLimit;
        }

        public ResilienceDefinition getResilience() {
            return resilience;
        }

        public void setResilience(ResilienceDefinition resilience) {
            this.resilience = resilience;
        }

        public RolloutDefinition getRollout() {
            return rollout;
        }

        public void setRollout(RolloutDefinition rollout) {
            this.rollout = rollout;
        }

        public String getCachePolicy() {
            return cachePolicy;
        }

        public void setCachePolicy(String cachePolicy) {
            this.cachePolicy = cachePolicy;
        }
    }

    public static class RateLimitDefinition {
        private Integer requestsPerMinute;
        private Integer burst;

        public Integer getRequestsPerMinute() {
            return requestsPerMinute;
        }

        public void setRequestsPerMinute(Integer requestsPerMinute) {
            this.requestsPerMinute = requestsPerMinute;
        }

        public Integer getBurst() {
            return burst;
        }

        public void setBurst(Integer burst) {
            this.burst = burst;
        }
    }

    public static class ResilienceDefinition {
        private Integer timeoutMs;
        private Integer retryMax;
        private Boolean circuitBreakerEnabled;

        public Integer getTimeoutMs() {
            return timeoutMs;
        }

        public void setTimeoutMs(Integer timeoutMs) {
            this.timeoutMs = timeoutMs;
        }

        public Integer getRetryMax() {
            return retryMax;
        }

        public void setRetryMax(Integer retryMax) {
            this.retryMax = retryMax;
        }

        public Boolean getCircuitBreakerEnabled() {
            return circuitBreakerEnabled;
        }

        public void setCircuitBreakerEnabled(Boolean circuitBreakerEnabled) {
            this.circuitBreakerEnabled = circuitBreakerEnabled;
        }
    }

    public static class RolloutDefinition {
        private String strategy;
        private Integer percent;

        public String getStrategy() {
            return strategy;
        }

        public void setStrategy(String strategy) {
            this.strategy = strategy;
        }

        public Integer getPercent() {
            return percent;
        }

        public void setPercent(Integer percent) {
            this.percent = percent;
        }
    }

    public static class AggregationRecipeDefinition {
        private String id;
        private String routeKey;
        private String joinStrategy;
        private Integer timeoutMs;
        private String cachePolicy;
        private List<DownstreamCallDefinition> downstreamCalls = new ArrayList<>();

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getRouteKey() {
            return routeKey;
        }

        public void setRouteKey(String routeKey) {
            this.routeKey = routeKey;
        }

        public String getJoinStrategy() {
            return joinStrategy;
        }

        public void setJoinStrategy(String joinStrategy) {
            this.joinStrategy = joinStrategy;
        }

        public Integer getTimeoutMs() {
            return timeoutMs;
        }

        public void setTimeoutMs(Integer timeoutMs) {
            this.timeoutMs = timeoutMs;
        }

        public String getCachePolicy() {
            return cachePolicy;
        }

        public void setCachePolicy(String cachePolicy) {
            this.cachePolicy = cachePolicy;
        }

        public List<DownstreamCallDefinition> getDownstreamCalls() {
            return downstreamCalls;
        }

        public void setDownstreamCalls(List<DownstreamCallDefinition> downstreamCalls) {
            this.downstreamCalls = downstreamCalls;
        }
    }

    public static class DownstreamCallDefinition {
        private String service;
        private String path;
        private List<String> fields = new ArrayList<>();

        public String getService() {
            return service;
        }

        public void setService(String service) {
            this.service = service;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public List<String> getFields() {
            return fields;
        }

        public void setFields(List<String> fields) {
            this.fields = fields;
        }
    }

    public static class ClientProfileDefinition {
        private String id;
        private String clientType;
        private List<String> allowedContracts = new ArrayList<>();
        private String policySetId;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getClientType() {
            return clientType;
        }

        public void setClientType(String clientType) {
            this.clientType = clientType;
        }

        public List<String> getAllowedContracts() {
            return allowedContracts;
        }

        public void setAllowedContracts(List<String> allowedContracts) {
            this.allowedContracts = allowedContracts;
        }

        public String getPolicySetId() {
            return policySetId;
        }

        public void setPolicySetId(String policySetId) {
            this.policySetId = policySetId;
        }
    }
}
