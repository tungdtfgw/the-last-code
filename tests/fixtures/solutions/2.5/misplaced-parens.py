# Cảm biến ở ngã tư (KHÔNG được sửa 3 dòng này)
khoang_cach = 60
camera_bat = True
den_pha = False

# Kai được qua khi drone ở xa hoặc camera tắt, và đèn pha không chiếu
if khoang_cach > 40 and not den_pha or not camera_bat:
    print("LENH: QUA")
else:
    print("LENH: CHO")
