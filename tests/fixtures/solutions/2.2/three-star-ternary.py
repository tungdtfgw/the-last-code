# Cảm biến Hàng Rào Ngoại Vi (KHÔNG được sửa 2 dòng này)
khoang_cach = 25
tam_quet = 30

# Luật của Kai: mặc định là đi, drone trong tầm quét thì nấp
lenh = "NAP" if khoang_cach <= tam_quet else "DI"
