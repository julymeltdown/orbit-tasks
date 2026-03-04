package com.orbit.agile.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(packages = "com.orbit.agile", importOptions = ImportOption.DoNotIncludeTests.class)
public class HexArchitectureTest {
    private static final String ROOT = "com.orbit.agile";
    private static final String DOMAIN = ROOT + "..domain..";
    private static final String APPLICATION = ROOT + "..application..";
    private static final String ADAPTERS_IN = ROOT + "..adapters.in..";
    private static final String ADAPTERS_OUT = ROOT + "..adapters.out..";
    private static final String CONFIG = ROOT + "..config..";

    @ArchTest
    static final ArchRule domain_should_not_depend_on_application_or_adapters = noClasses()
            .that().resideInAPackage(DOMAIN)
            .should().dependOnClassesThat()
            .resideInAnyPackage(APPLICATION, ADAPTERS_IN, ADAPTERS_OUT, CONFIG)
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule application_should_not_depend_on_adapters_or_config = noClasses()
            .that().resideInAPackage(APPLICATION)
            .should().dependOnClassesThat()
            .resideInAnyPackage(ADAPTERS_IN, ADAPTERS_OUT, CONFIG)
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule inbound_adapters_should_not_depend_on_outbound = noClasses()
            .that().resideInAPackage(ADAPTERS_IN)
            .should().dependOnClassesThat()
            .resideInAPackage(ADAPTERS_OUT)
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule outbound_adapters_should_not_depend_on_inbound = noClasses()
            .that().resideInAPackage(ADAPTERS_OUT)
            .should().dependOnClassesThat()
            .resideInAPackage(ADAPTERS_IN)
            .allowEmptyShould(true);
}

