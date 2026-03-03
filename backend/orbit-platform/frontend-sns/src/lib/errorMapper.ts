import type { ApiError } from "@/lib/apiClient";

const MESSAGE_MAP: Array<{ contains: string; message: string }> = [
  { contains: "Invalid credentials", message: "아이디 또는 비밀번호가 올바르지 않습니다." },
  { contains: "Email already registered", message: "이미 가입된 이메일입니다." },
  { contains: "Invalid email format or domain", message: "이메일 형식 또는 도메인이 올바르지 않습니다." },
  { contains: "Invalid email format", message: "이메일 형식이 올바르지 않습니다." },
  { contains: "well-formed email address", message: "이메일 형식이 올바르지 않습니다." },
  { contains: "must not be blank", message: "필수 입력값을 확인해 주세요." },
  { contains: "size must be between 8 and 128", message: "비밀번호는 8~128자로 설정해 주세요." },
  { contains: "Email linked", message: "이 이메일로 이미 다른 계정이 존재합니다." },
  { contains: "Email already linked to another user", message: "이 이메일은 다른 계정에 연결되어 있습니다." },
  { contains: "Email linked to multiple users", message: "이 이메일은 여러 계정에 연결되어 있습니다." },
  { contains: "User not found for verification", message: "인증할 사용자를 찾지 못했습니다." },
  { contains: "User not found", message: "사용자를 찾지 못했습니다." },
  { contains: "User not active", message: "이메일 인증 또는 프로필 설정이 필요합니다." },
  { contains: "Username already taken", message: "이미 사용 중인 유저네임입니다." },
  { contains: "Username is required", message: "유저네임을 입력해 주세요." },
  { contains: "Username must be", message: "유저네임은 3~20자 영문/숫자/언더스코어만 가능합니다." },
  { contains: "Display name is required", message: "사용자 이름을 입력해 주세요." },
  { contains: "Avatar URL is required", message: "프로필 사진 URL을 입력해 주세요." },
  { contains: "Avatar image is required", message: "프로필 사진을 선택해 주세요." },
  { contains: "Avatar image must be <= 1MB", message: "프로필 사진은 1MB 이하만 업로드할 수 있습니다." },
  { contains: "Profile message is required", message: "프로필 메시지를 입력해 주세요." },
  { contains: "Profile not found", message: "해당 유저네임을 찾지 못했습니다." },
  { contains: "Post not found", message: "게시글을 찾지 못했습니다." },
  { contains: "Verification failed", message: "인증 코드가 올바르지 않습니다." },
  { contains: "Refresh token revoked", message: "세션이 만료되었습니다. 다시 로그인해 주세요." },
  { contains: "Cannot follow yourself", message: "자기 자신을 팔로우할 수 없습니다." },
  { contains: "Follower and followee are required", message: "팔로우할 사용자를 확인해 주세요." },
];

export function resolveErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";
  const matched = MESSAGE_MAP.find((item) => rawMessage.includes(item.contains));
  return matched?.message ?? rawMessage;
}

export function alertForError(error: unknown) {
  const message = resolveErrorMessage(error);
  if (message) {
    window.alert(message);
  }
  return message;
}

export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    return (error as ApiError).code;
  }
  return undefined;
}
