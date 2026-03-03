const buildTimeBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://tasksapi.infinitefallcult.trade";

const resolveApiBase = () => {
  if (typeof window === "undefined") {
    return buildTimeBase;
  }
  if (buildTimeBase.startsWith("http://") && window.location.protocol === "https:") {
    return buildTimeBase.replace(/^http:\/\//, "https://");
  }
  return buildTimeBase;
};

export const env = {
  apiBaseUrl: resolveApiBase(),
};
