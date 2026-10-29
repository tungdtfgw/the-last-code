# Khoảng cách tới tín hiệu lạ gần nhất (KHÔNG được sửa dòng này)
khoang_cach = 10

# Mức báo động của tháp: xét từ gần nhất ra xa.
if khoang_cach < 20:
    print("MUC: BAO DONG")
if khoang_cach >= 20 and khoang_cach < 50:
    print("MUC: NGUY HIEM")
if khoang_cach >= 50 and khoang_cach < 100:
    print("MUC: CANH GIAC")
if khoang_cach >= 100:
    print("MUC: AN TOAN")
