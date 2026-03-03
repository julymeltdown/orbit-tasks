package com.example.auth.adapters.out.oauth;

import com.example.auth.application.port.out.OAuthClientPort;
import com.example.auth.application.port.out.OAuthUserInfo;
import com.example.auth.domain.IdentityProvider;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Component
public class OAuthClientService implements OAuthClientPort {
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    private final ClientRegistrationRepository registrations;
    private final RestClient restClient;
    private final OAuthUserInfoMapper userInfoMapper;

    public OAuthClientService(ClientRegistrationRepository registrations,
                              RestClient oauthRestClient,
                              OAuthUserInfoMapper userInfoMapper) {
        this.registrations = registrations;
        this.restClient = oauthRestClient;
        this.userInfoMapper = userInfoMapper;
    }

    @Override
    public OAuthUserInfo fetchUserInfo(IdentityProvider provider, String code, String redirectUri) {
        ClientRegistration registration = registration(provider);
        Map<String, Object> tokenResponse = exchangeCode(registration, code, redirectUri);
        Map<String, Object> attributes = resolveAttributes(provider, registration, tokenResponse);
        return userInfoMapper.map(provider, attributes);
    }

    @Override
    public String buildAuthorizationUri(IdentityProvider provider, String redirectUri, String state) {
        ClientRegistration registration = registration(provider);
        OAuth2AuthorizationRequest request = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri(registration.getProviderDetails().getAuthorizationUri())
                .clientId(registration.getClientId())
                .redirectUri(redirectUri)
                .scopes(registration.getScopes())
                .state(state)
                .build();
        return request.getAuthorizationRequestUri();
    }

    private Map<String, Object> exchangeCode(ClientRegistration registration, String code, String redirectUri) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", redirectUri);
        form.add("client_id", registration.getClientId());
        if (registration.getClientSecret() != null && !registration.getClientSecret().isBlank()) {
            form.add("client_secret", registration.getClientSecret());
        }
        String tokenUri = registration.getProviderDetails().getTokenUri();
        Map<String, Object> response = restClient.post()
                .uri(tokenUri)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(MAP_TYPE);
        return response == null ? Map.of() : response;
    }

    private Map<String, Object> resolveAttributes(IdentityProvider provider,
                                                  ClientRegistration registration,
                                                  Map<String, Object> tokenResponse) {
        Optional<String> userInfoUri = Optional.ofNullable(registration.getProviderDetails().getUserInfoEndpoint().getUri())
                .filter(value -> !value.isBlank());
        if (provider == IdentityProvider.APPLE && userInfoUri.isEmpty()) {
            return extractAppleClaims(registration, tokenResponse);
        }
        Object accessToken = tokenResponse.get("access_token");
        if (accessToken == null || accessToken.toString().isBlank()) {
            throw new IllegalArgumentException("Access token missing from OAuth response");
        }
        return restClient.get()
                .uri(userInfoUri.orElseThrow(() -> new IllegalStateException("User info endpoint not configured")))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .body(MAP_TYPE);
    }

    private Map<String, Object> extractAppleClaims(ClientRegistration registration,
                                                   Map<String, Object> tokenResponse) {
        Object idTokenRaw = tokenResponse.get("id_token");
        String idToken = idTokenRaw == null ? null : idTokenRaw.toString();
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Apple id_token missing from response");
        }
        String jwkSetUri = registration.getProviderDetails().getJwkSetUri();
        if (jwkSetUri == null || jwkSetUri.isBlank()) {
            throw new IllegalArgumentException("Apple JWK set URI is required");
        }
        JwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        Jwt jwt = decoder.decode(idToken);
        return jwt.getClaims();
    }

    private ClientRegistration registration(IdentityProvider provider) {
        if (provider == IdentityProvider.EMAIL) {
            throw new IllegalArgumentException("OAuth provider required");
        }
        ClientRegistration registration = registrations.findByRegistrationId(provider.name().toLowerCase());
        return Objects.requireNonNull(registration, "OAuth registration missing");
    }
}
