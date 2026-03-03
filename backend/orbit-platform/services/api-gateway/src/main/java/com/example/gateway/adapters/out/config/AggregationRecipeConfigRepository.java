package com.example.gateway.adapters.out.config;

import com.example.gateway.application.port.out.AggregationRecipeRepository;
import com.example.gateway.config.GatewayGovernanceProperties;
import com.example.gateway.domain.aggregation.AggregationRecipe;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class AggregationRecipeConfigRepository implements AggregationRecipeRepository {
    private final Map<String, AggregationRecipe> recipes = new ConcurrentHashMap<>();

    public AggregationRecipeConfigRepository(GatewayGovernanceProperties properties) {
        loadFromConfig(properties);
    }

    @Override
    public List<AggregationRecipe> findAll() {
        return List.copyOf(recipes.values());
    }

    @Override
    public Optional<AggregationRecipe> findByRouteKey(String routeKey) {
        return recipes.values().stream()
                .filter(recipe -> recipe.routeKey().equals(routeKey))
                .findFirst();
    }

    private void loadFromConfig(GatewayGovernanceProperties properties) {
        for (GatewayGovernanceProperties.AggregationRecipeDefinition definition : properties.getAggregationRecipes()) {
            String id = (definition.getId() == null || definition.getId().isBlank())
                    ? UUID.randomUUID().toString()
                    : definition.getId();
            List<AggregationRecipe.DownstreamCall> downstreamCalls = definition.getDownstreamCalls().stream()
                    .map(call -> new AggregationRecipe.DownstreamCall(
                            call.getService(),
                            call.getPath(),
                            call.getFields()))
                    .toList();
            AggregationRecipe recipe = new AggregationRecipe(
                    id,
                    definition.getRouteKey(),
                    downstreamCalls,
                    definition.getJoinStrategy(),
                    definition.getTimeoutMs(),
                    definition.getCachePolicy());
            recipes.put(id, recipe);
        }
    }
}
