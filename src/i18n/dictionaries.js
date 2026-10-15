// القواميس الإنجليزية (مفاتيحها عربية). تُحمَّل عند اختيار English فقط، فلا يدفع الزائر العربي ثمنها.
import en from "./en.json";
import enExtra from "./en.extra.json";
import enRedesign from "./en.redesign.json";
import enLanding from "./en.landing.json";

export default { ...en, ...enExtra, ...enRedesign, ...enLanding };
