# Cảm biến ở ngã tư (KHÔNG được sửa 3 dòng này)
khoang_cach = 60
camera_bat = True
den_pha = False

# Kai được qua khi drone ở xa hoặc camera tắt, và đèn pha không chiếu
lenh = "QUA" if (khoang_cach > 40 or not camera_bat) and not den_pha else "CHO"
print("LENH: " + lenh)
