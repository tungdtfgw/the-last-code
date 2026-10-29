# Khoảng cách tới tín hiệu lạ gần nhất (KHÔNG được sửa dòng này)
khoang_cach = 10

# Mức báo động của tháp: xét từ gần nhất ra xa.
if khoang_cach < 50:
    print("MUC: NGUY HIEM")
elif khoang_cach < 20:
    print("MUC: BAO DONG")
elif khoang_cach < 100:
    print("MUC: CANH GIAC")
else:
    print("MUC: AN TOAN")
