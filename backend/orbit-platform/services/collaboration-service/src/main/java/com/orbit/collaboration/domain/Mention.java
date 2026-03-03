package com.orbit.collaboration.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public record Mention(
        UUID mentionId,
        UUID messageId,
        String mentionedUser,
        int start,
        int end
) {
    private static final Pattern MENTION_PATTERN = Pattern.compile("@([a-zA-Z0-9._-]{2,64})");

    public Mention {
        if (messageId == null) {
            throw new IllegalArgumentException("Message id is required");
        }
        if (mentionedUser == null || mentionedUser.isBlank()) {
            throw new IllegalArgumentException("Mentioned user is required");
        }
        if (start < 0 || end <= start) {
            throw new IllegalArgumentException("Mention offsets are invalid");
        }
    }

    public static List<Mention> parseFrom(UUID messageId, String text) {
        List<Mention> mentions = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return mentions;
        }
        Matcher matcher = MENTION_PATTERN.matcher(text);
        while (matcher.find()) {
            mentions.add(new Mention(
                    UUID.randomUUID(),
                    messageId,
                    matcher.group(1),
                    matcher.start(1),
                    matcher.end(1)));
        }
        return mentions;
    }
}
