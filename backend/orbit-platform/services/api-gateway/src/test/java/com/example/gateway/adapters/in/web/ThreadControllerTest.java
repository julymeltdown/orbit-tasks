package com.example.gateway.adapters.in.web;

import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ThreadControllerTest {
    @Test
    void returnsEnrichedThreadContextAndMentionInboxItems() {
        ThreadController controller = new ThreadController();

        ThreadController.ThreadView thread = controller.createThreadV2(new ThreadController.CreateThreadRequest(
                "89390d44-1506-38c5-8c04-fb43144dcd13",
                "2ed355f0-94bc-4de1-bc5d-8a0ea93c159b",
                "결제 장애 대응",
                "API 장애 triage",
                "owner"));

        controller.postMessageV2(thread.threadId(), new ThreadController.PostMessageRequest(
                "owner",
                "@alice blocker 확인 부탁드립니다. ETA asap"));

        ThreadController.ThreadView reloaded = controller.getThreadV2(thread.threadId());
        List<ThreadController.InboxItemView> inbox = controller.inboxV2("alice", "all");

        assertEquals("결제 장애 대응", reloaded.workItemTitle());
        assertEquals(1, reloaded.messageCount());
        assertNotNull(reloaded.lastMessagePreview());
        assertEquals(1, inbox.size());
        assertEquals("MENTION", inbox.get(0).kind());
        assertEquals("HIGH", inbox.get(0).urgency());
        assertEquals("Open thread and respond", inbox.get(0).nextActionLabel());
        assertEquals("API 장애 triage · 결제 장애 대응", inbox.get(0).sourceSummary());
    }

    @Test
    void canFilterResolvedInboxItems() {
        ThreadController controller = new ThreadController();
        ThreadController.ThreadView thread = controller.createThreadV2(new ThreadController.CreateThreadRequest(
                "89390d44-1506-38c5-8c04-fb43144dcd13",
                "2ed355f0-94bc-4de1-bc5d-8a0ea93c159b",
                "결제 장애 대응",
                "API 장애 triage",
                "owner"));
        controller.postMessageV2(thread.threadId(), new ThreadController.PostMessageRequest(
                "owner",
                "@alice 답변 부탁드립니다"));
        ThreadController.InboxItemView item = controller.inboxV2("alice", "all").get(0);

        controller.patchInboxV2(item.inboxItemId(), new ThreadController.PatchInboxRequest("alice", "RESOLVED", "done"));

        assertEquals(1, controller.inboxV2("alice", "resolved").size());
        assertEquals(0, controller.inboxV2("alice", "needs_action").size());
    }
}
