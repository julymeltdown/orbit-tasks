package com.example.gateway.application.port.out;

import com.example.gateway.domain.aggregation.AggregationRecipe;
import java.util.List;
import java.util.Optional;

public interface AggregationRecipeRepository {
    List<AggregationRecipe> findAll();

    Optional<AggregationRecipe> findByRouteKey(String routeKey);
}
