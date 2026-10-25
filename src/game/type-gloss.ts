/**
 * One-line Vietnamese meaning of a Python type name, shown next to the name itself
 * (tooltips, terminal) so a player meets `str` or `tuple` before a level teaches it.
 * Explains the word only: never how to write a value of that shape.
 */
const GLOSS: Record<string, string> = {
  str: "chữ (chuỗi ký tự)",
  int: "số nguyên",
  float: "số thực, có phần thập phân",
  bool: "đúng hoặc sai",
  type: "một hình dạng, như khuôn của một giá trị",
  tuple: "nhiều giá trị ghép lại bằng dấu phẩy",
  list: "danh sách nhiều giá trị",
  dict: "bảng tra khóa → giá trị",
  NoneType: "không có giá trị",
};

export const typeGloss = (name: string | null | undefined): string | undefined => (name ? GLOSS[name] : undefined);

/** `str: chữ (chuỗi ký tự)`, or just the name when it has no gloss. */
export const typeTitle = (name: string): string => {
  const g = typeGloss(name);
  return g ? `${name}: ${g}` : name;
};
