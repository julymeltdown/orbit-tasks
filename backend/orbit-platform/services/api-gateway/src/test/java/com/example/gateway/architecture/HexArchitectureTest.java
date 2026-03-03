package com.example.gateway.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import java.util.List;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Test;

@AnalyzeClasses(packages = "com.example.gateway", importOptions = ImportOption.DoNotIncludeTests.class)
public class HexArchitectureTest {
    private static final String ROOT = "com.example.gateway";
    private static final String DOMAIN = ROOT + "..domain..";
    private static final String APPLICATION = ROOT + "..application..";
    private static final String ADAPTERS_IN = ROOT + "..adapters.in..";
    private static final String ADAPTERS_OUT = ROOT + "..adapters.out..";
    private static final String CONFIG = ROOT + "..config..";
    private static final String PROTO = ROOT + "..v1..";

    @ArchTest
    static final ArchRule domain_should_not_depend_on_application_or_infra = noClasses()
            .that().resideInAPackage(DOMAIN)
            .should().dependOnClassesThat()
            .resideInAnyPackage(APPLICATION, ADAPTERS_IN, ADAPTERS_OUT, CONFIG, PROTO);

    @ArchTest
    static final ArchRule application_should_not_depend_on_infra = noClasses()
            .that().resideInAPackage(APPLICATION)
            .should().dependOnClassesThat()
            .resideInAnyPackage(ADAPTERS_IN, ADAPTERS_OUT, CONFIG, PROTO);

    @ArchTest
    static final ArchRule inbound_adapters_should_not_depend_on_outbound_adapters = noClasses()
            .that().resideInAPackage(ADAPTERS_IN)
            .should().dependOnClassesThat()
            .resideInAPackage(ADAPTERS_OUT)
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule outbound_adapters_should_not_depend_on_inbound_adapters = noClasses()
            .that().resideInAPackage(ADAPTERS_OUT)
            .should().dependOnClassesThat()
            .resideInAPackage(ADAPTERS_IN)
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule no_layer_should_depend_on_config = noClasses()
            .that().resideOutsideOfPackages(CONFIG)
            .should().dependOnClassesThat()
            .resideInAPackage(CONFIG);

    @Test
    void required_layers_exist_and_no_stray_packages() {
        JavaClasses classes = new ClassFileImporter()
                .withImportOption(new ImportOption.DoNotIncludeTests())
                .importPackages(ROOT);

        assertLayerNotEmpty(classes, ROOT + ".domain");
        assertLayerNotEmpty(classes, ROOT + ".application");
        assertLayerNotEmpty(classes, ROOT + ".adapters.in");
        assertLayerNotEmpty(classes, ROOT + ".adapters.out");
        assertLayerNotEmpty(classes, ROOT + ".config");

        List<String> offenders = StreamSupport.stream(classes.spliterator(), false)
                .filter(javaClass -> javaClass.getPackageName().startsWith(ROOT))
                .filter(javaClass -> !javaClass.getPackageName().startsWith(ROOT + ".domain")
                        && !javaClass.getPackageName().startsWith(ROOT + ".application")
                        && !javaClass.getPackageName().startsWith(ROOT + ".adapters")
                        && !javaClass.getPackageName().startsWith(ROOT + ".config")
                        && !javaClass.getPackageName().startsWith(ROOT + ".v1")
                        && !(javaClass.getPackageName().equals(ROOT)
                        && javaClass.getSimpleName().endsWith("Application")))
                .map(javaClass -> javaClass.getName() + " (" + javaClass.getPackageName() + ")")
                .sorted()
                .toList();

        assertTrue(offenders.isEmpty(),
                "Disallowed production packages/classes detected. Move them under domain/application/adapters/config.\n"
                        + String.join("\n", offenders));
    }

    private static void assertLayerNotEmpty(JavaClasses classes, String packagePrefix) {
        boolean exists = StreamSupport.stream(classes.spliterator(), false)
                .anyMatch(javaClass -> javaClass.getPackageName().startsWith(packagePrefix));
        assertTrue(exists, "Expected at least one production class in package: " + packagePrefix);
    }
}
