const fs = require("fs");

// قراءة الملف
const data = JSON.parse(fs.readFileSync("input.json", "utf-8"));

// دالة بتحول أي _id string لـ $oid حتى لو متداخلة
function convertIds(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertIds);
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (let key in obj) {
      if (key === "_id" && typeof obj[key] === "string") {
        newObj[key] = { $oid: obj[key] };
      } else {
        newObj[key] = convertIds(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// تنفيذ التحويل
const result = convertIds(data);

// حفظ الملف الجديد
fs.writeFileSync("output.json", JSON.stringify(result, null, 2));

console.log("✅ Done - كله اتحول");