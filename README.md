# Momentum

약속 그룹을 만들고, 초대 코드로 참여해 준비 상태와 메시지를 함께 관리하는 Next.js 웹앱입니다.

## Vercel 배포

1. 이 폴더의 내용만 새 GitHub 저장소의 최상위에 업로드합니다.
2. Vercel에서 해당 저장소를 Import합니다.
3. Storage에서 비공개 Vercel Blob Store를 프로젝트에 연결합니다.
4. `BLOB_READ_WRITE_TOKEN`이 Production과 Preview 환경에 등록됐는지 확인한 뒤 배포합니다.

토큰과 `.env.local` 파일은 GitHub에 올리지 않습니다.
