import pandas as pd

# 주차별 데이터 정의 (예시 데이터 포함 - 실제 75문항 생성 로직)
quiz_data = []

weeks = ["1주차_AI개론", "2주차_머신러닝", "3주차_데이터윤리", "4주차_생성형AI", "5주차_미래교육"]

for week in weeks:
    # 객관식 10문항 생성
    for i in range(1, 11):
        quiz_data.append({
            "주차": week,
            "유형": "객관식",
            "번호": i,
            "문제": f"{week} 관련 객관식 문제 {i}번",
            "보기": "1) 보기A, 2) 보기B, 3) 보기C, 4) 보기D, 5) 보기E",
            "정답": "1",
            "배점": 0.5
        })
    # 단답형 5문항 생성
    for i in range(1, 6):
        quiz_data.append({
            "주차": week,
            "유형": "단답형",
            "번호": i + 10,
            "문제": f"{week} 관련 단답형 문제 {i}번",
            "보기": "-",
            "정답": f"{week} 핵심 키워드 {i}",
            "배점": 1.0
        })

# 엑셀 파일로 저장
df = pd.DataFrame(quiz_data)
with pd.ExcelWriter("AI_Comprehensive_Quiz_Set.xlsx") as writer:
    for week in weeks:
        df[df["주차"] == week].to_excel(writer, sheet_name=week, index=False)

print("75문항이 포함된 5회차 통합 퀴즈 엑셀 파일이 생성되었습니다.")