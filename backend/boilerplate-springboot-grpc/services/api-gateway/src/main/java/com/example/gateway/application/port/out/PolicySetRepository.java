package com.example.gateway.application.port.out;

import com.example.gateway.domain.policy.PolicySet;
import java.util.List;
import java.util.Optional;

public interface PolicySetRepository {
    List<PolicySet> findAll();

    Optional<PolicySet> findById(String policyId);

    PolicySet save(PolicySet policySet);
}
