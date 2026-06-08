# OK&Lee Family OKR

가족 미션과 핵심가치를 바탕으로 분기 가족 OKR을 정하고, 가족 KR을 개인 Objective와 KR, Initiative로 연결하는 웹 앱입니다.

## Render 배포 설정

- Type: Static Site
- Build Command: 비워두거나 `echo "no build"`
- Publish Directory: `.`

## Supabase

Supabase 초기 테이블과 정책은 `supabase/setup.sql`을 SQL Editor에서 실행하면 됩니다.

현재 앱은 로그인 없는 1차 버전입니다. 같은 Render 주소에 접속한 가족 구성원은 하나의 공용 OKR 데이터를 함께 봅니다.
