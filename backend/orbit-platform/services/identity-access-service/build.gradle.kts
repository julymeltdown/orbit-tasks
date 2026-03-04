import com.google.protobuf.gradle.*
import org.gradle.testing.jacoco.tasks.JacocoCoverageVerification
import org.gradle.testing.jacoco.tasks.JacocoReport

plugins {
    id("java")
    jacoco
    id("org.springframework.boot") version "4.0.1"
    id("io.spring.dependency-management") version "1.1.7"
    id("com.google.protobuf") version "0.9.4"
}

repositories {
    mavenCentral()
    maven { url = uri("https://repo.spring.io/milestone") }
    maven { url = uri("https://repo.spring.io/snapshot") }
}

dependencies {
    implementation(platform("org.springframework.grpc:spring-grpc-dependencies:1.0.2"))
    compileOnly("org.projectlombok:lombok:1.18.36")
    annotationProcessor("org.projectlombok:lombok:1.18.36")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.grpc:spring-grpc-spring-boot-starter")
    implementation("javax.annotation:javax.annotation-api:1.3.2")
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("com.h2database:h2:2.2.224")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("io.rest-assured:rest-assured:5.5.0")
    testImplementation("io.rest-assured:spring-mock-mvc:5.5.0")
    testImplementation("org.apache.httpcomponents:httpclient:4.5.14")
    testImplementation("org.springframework.grpc:spring-grpc-test")
    testImplementation("org.testcontainers:junit-jupiter:1.20.4")
    testImplementation("org.testcontainers:postgresql:1.20.4")
    testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
    testImplementation("com.tngtech.archunit:archunit-junit5:1.2.1")
    testCompileOnly("org.projectlombok:lombok:1.18.36")
    testAnnotationProcessor("org.projectlombok:lombok:1.18.36")
    testRuntimeOnly("com.h2database:h2:2.2.224")

    constraints {
        testImplementation("org.apache.groovy:groovy:4.0.22")
        testImplementation("org.apache.groovy:groovy-json:4.0.22")
        testImplementation("org.apache.groovy:groovy-xml:4.0.22")
    }
}

dependencyManagement {
    imports {
        mavenBom("org.apache.groovy:groovy-bom:4.0.22")
    }
}


protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:3.25.3"
    }
    plugins {
        id("grpc") {
            artifact = "io.grpc:protoc-gen-grpc-java:1.63.0"
        }
    }
    generateProtoTasks {
        all().forEach { task ->
            task.plugins {
                id("grpc")
            }
        }
    }
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    finalizedBy(tasks.named("jacocoTestReport"))
}

tasks.named<JacocoReport>("jacocoTestReport") {
    dependsOn(tasks.named("test"))
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }

    classDirectories.setFrom(files(classDirectories.files.map { dir ->
        fileTree(dir) {
            exclude(
                "**/config/**",
                "**/v1/**",
                "**/*Application*"
            )
        }
    }))
}

configurations.all {
    resolutionStrategy {
        force("org.apache.groovy:groovy:4.0.22")
        force("org.apache.groovy:groovy-json:4.0.22")
        force("org.apache.groovy:groovy-xml:4.0.22")
    }
}

tasks.named<JacocoCoverageVerification>("jacocoTestCoverageVerification") {
    dependsOn(tasks.named("test"))
    violationRules {
        rule {
            enabled = true
            limit {
                counter = "LINE"
                value = "COVEREDRATIO"
                minimum = "0.70".toBigDecimal()
            }
            limit {
                counter = "BRANCH"
                value = "COVEREDRATIO"
                minimum = "0.55".toBigDecimal()
            }
        }
    }

    classDirectories.setFrom(files(classDirectories.files.map { dir ->
        fileTree(dir) {
            exclude(
                "**/config/**",
                "**/v1/**",
                "**/*Application*"
            )
        }
    }))
}
