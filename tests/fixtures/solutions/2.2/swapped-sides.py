# Cảm biến Hàng Rào Ngoài (KHÔNG được sửa 2 dòng này)
khoang_cach = 25
tam_quet = 30

# Luật của Kai: mặc định là đi, drone trong tầm quét thì nấp
lenh = "DI"
if tam_quet <= khoang_cach:
    lenh = "NAP"
