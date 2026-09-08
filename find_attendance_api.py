with open(r"C:\Users\Falcon\Desktop\HRMS\frontend\src\modules\hrms\components\views\AttendanceView.jsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for idx, line in enumerate(lines):
        if 'api.' in line or 'request' in line:
            print(f"Line {idx+1}: {line.strip()}")
