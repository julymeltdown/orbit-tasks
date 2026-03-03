package com.example.auth.adapters.out.redis;

import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

@Component
public class RedisScripts {
    private final DefaultRedisScript<Long> refreshRotateScript;

    public RedisScripts() {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setResultType(Long.class);
        script.setScriptText("""
                if redis.call('EXISTS', KEYS[1]) == 0 then
                  return 0
                end
                if redis.call('EXISTS', KEYS[2]) == 1 then
                  return 0
                end
                local tokenHash = redis.call('HGET', KEYS[1], 'token_hash')
                if tokenHash ~= ARGV[1] then
                  return 0
                end
                redis.call('SET', KEYS[2], '1', 'EX', ARGV[5])
                redis.call('DEL', KEYS[1])
                redis.call('HSET', KEYS[3],
                  'user_id', ARGV[2],
                  'token_hash', ARGV[3],
                  'expires_at', ARGV[4],
                  'revoked', 'false')
                redis.call('EXPIRE', KEYS[3], ARGV[5])
                return 1
                """);
        this.refreshRotateScript = script;
    }

    public DefaultRedisScript<Long> refreshRotateScript() {
        return refreshRotateScript;
    }
}
