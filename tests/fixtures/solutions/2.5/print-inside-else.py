# Cảm biến ở ngã tư (KHÔNG được sửa 3 dòng này)
khoang_cach = 60
camera_bat = True
den_pha = False

# Kai được qua khi drone ở xa hoặc camera tắt, và đèn pha không chiếu
if (khoang_cach > 40 or not camera_bat) and not den_pha:
    lenh = "QUA"
else:
    lenh = "CHO"
    print(f"LENH: {lenh}")
