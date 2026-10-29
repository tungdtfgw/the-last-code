# Cảm biến ở ngã tư (KHÔNG được sửa 3 dòng này)
khoang_cach = 60
camera_bat = True
den_pha = False

# Kai được qua khi drone ở xa hoặc camera tắt, và đèn pha không chiếu
if den_pha:
    print("LENH: CHO")
elif khoang_cach > 40:
    print("LENH: QUA")
elif camera_bat:
    print("LENH: CHO")
else:
    print("LENH: QUA")
