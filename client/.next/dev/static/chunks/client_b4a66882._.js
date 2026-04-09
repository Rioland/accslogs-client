(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/client/app/components/Navbar2.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Navbar2
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$app$2f$components$2f$Wrapper$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/app/components/Wrapper.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/lib/supabaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$ArrowDown2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown2$3e$__ = __turbopack_context__.i("[project]/client/node_modules/iconsax-reactjs/dist/esm/ArrowDown2.js [app-client] (ecmascript) <export default as ArrowDown2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$HamburgerMenu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HamburgerMenu$3e$__ = __turbopack_context__.i("[project]/client/node_modules/iconsax-reactjs/dist/esm/HamburgerMenu.js [app-client] (ecmascript) <export default as HamburgerMenu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$SearchNormal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__SearchNormal$3e$__ = __turbopack_context__.i("[project]/client/node_modules/iconsax-reactjs/dist/esm/SearchNormal.js [app-client] (ecmascript) <export default as SearchNormal>");
;
var _s = __turbopack_context__.k.signature();
/* eslint-disable @next/next/no-img-element */ "use client";
;
;
;
;
function Navbar2({ onSelectCategory }) {
    _s();
    const [categories, setCategories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [hoveredCategory, setHoveredCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Navbar2.useEffect": ()=>{
            const fetchData = {
                "Navbar2.useEffect.fetchData": async ()=>{
                    const { data: cats, error: catError } = await __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].from("socialmedia_account_category").select("*");
                    const { data: subs, error: subError } = await __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].from("socialmedia_account_subcategory").select("*");
                    if (catError || subError) {
                        console.error("Error fetching categories or subcategories:", catError, subError);
                        return;
                    }
                    if (cats && subs) {
                        const categoriesWithSubs = cats.map({
                            "Navbar2.useEffect.fetchData.categoriesWithSubs": (cat)=>({
                                    ...cat,
                                    subcategories: subs.filter({
                                        "Navbar2.useEffect.fetchData.categoriesWithSubs": (sub)=>sub.category_id === cat.id
                                    }["Navbar2.useEffect.fetchData.categoriesWithSubs"])
                                })
                        }["Navbar2.useEffect.fetchData.categoriesWithSubs"]);
                        setCategories(categoriesWithSubs);
                    }
                }
            }["Navbar2.useEffect.fetchData"];
            fetchData();
        }
    }["Navbar2.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full bg-white shadow-sm ",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$app$2f$components$2f$Wrapper$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row justify-between items-center py-3 gap-4 md:gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: "/images/logo.png",
                        alt: "logo",
                        className: "object-contain w-48 h-48 md:w-38 md:h-38 "
                    }, void 0, false, {
                        fileName: "[project]/client/app/components/Navbar2.tsx",
                        lineNumber: 64,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full md:w-max-content ",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-[#F87D1F] text-white p-2 rounded-md hover:bg-[#e06b10] cursor-pointer flex flex-row gap-2 items-center justify-between",
                                onClick: ()=>setIsOpen(!isOpen),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-row gap-2 items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$HamburgerMenu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__HamburgerMenu$3e$__["HamburgerMenu"], {
                                                size: "32",
                                                color: "#ffffff",
                                                variant: "Outline"
                                            }, void 0, false, {
                                                fileName: "[project]/client/app/components/Navbar2.tsx",
                                                lineNumber: 75,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-white",
                                                children: "Select a Category"
                                            }, void 0, false, {
                                                fileName: "[project]/client/app/components/Navbar2.tsx",
                                                lineNumber: 76,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/client/app/components/Navbar2.tsx",
                                        lineNumber: 74,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$ArrowDown2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown2$3e$__["ArrowDown2"], {
                                        size: "32",
                                        color: "#ffffff",
                                        variant: "Bold",
                                        className: isOpen ? "transform rotate-180" : ""
                                    }, void 0, false, {
                                        fileName: "[project]/client/app/components/Navbar2.tsx",
                                        lineNumber: 78,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/client/app/components/Navbar2.tsx",
                                lineNumber: 70,
                                columnNumber: 13
                            }, this),
                            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-max",
                                onMouseLeave: ()=>setIsOpen(false),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            className: "py-2",
                                            children: categories.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    className: "px-4 py-2 hover:bg-gray-100 cursor-pointer",
                                                    onMouseEnter: ()=>setHoveredCategory(cat),
                                                    onClick: ()=>{
                                                        onSelectCategory?.(cat);
                                                        setIsOpen(false);
                                                    },
                                                    children: cat.name
                                                }, cat.id, false, {
                                                    fileName: "[project]/client/app/components/Navbar2.tsx",
                                                    lineNumber: 93,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/client/app/components/Navbar2.tsx",
                                            lineNumber: 91,
                                            columnNumber: 19
                                        }, this),
                                        hoveredCategory && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                            className: "py-2 border-l border-gray-200",
                                            children: hoveredCategory.subcategories.map((sub)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    className: "px-4 py-2 hover:bg-gray-100 cursor-pointer",
                                                    onClick: ()=>{
                                                        onSelectCategory?.(hoveredCategory, sub);
                                                        setIsOpen(false);
                                                    },
                                                    children: sub.name
                                                }, sub.id, false, {
                                                    fileName: "[project]/client/app/components/Navbar2.tsx",
                                                    lineNumber: 109,
                                                    columnNumber: 25
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/client/app/components/Navbar2.tsx",
                                            lineNumber: 107,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/client/app/components/Navbar2.tsx",
                                    lineNumber: 90,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/client/app/components/Navbar2.tsx",
                                lineNumber: 86,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/app/components/Navbar2.tsx",
                        lineNumber: 69,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border border-gray-500 py-2 px-4 rounded-md flex items-center  md:ml-6 w-full md:w-max-content",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "Search for products...",
                                className: "w-full outline-none px-4 text-gray-700"
                            }, void 0, false, {
                                fileName: "[project]/client/app/components/Navbar2.tsx",
                                lineNumber: 129,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$SearchNormal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__SearchNormal$3e$__["SearchNormal"], {
                                size: "32",
                                color: "#000000",
                                variant: "Outline"
                            }, void 0, false, {
                                fileName: "[project]/client/app/components/Navbar2.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/client/app/components/Navbar2.tsx",
                        lineNumber: 128,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/app/components/Navbar2.tsx",
                lineNumber: 63,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/client/app/components/Navbar2.tsx",
            lineNumber: 62,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/client/app/components/Navbar2.tsx",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
_s(Navbar2, "ZRZ36hG6iwVFOuh8JalVv0cIzmQ=");
_c = Navbar2;
var _c;
__turbopack_context__.k.register(_c, "Navbar2");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/client/app/components/Navbar2.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/client/app/components/Navbar2.tsx [app-client] (ecmascript)"));
}),
"[project]/client/node_modules/iconsax-reactjs/dist/esm/SearchNormal.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SearchNormal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$_rollupPluginBabelHelpers$2d$3bc641ae$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/iconsax-reactjs/dist/esm/_rollupPluginBabelHelpers-3bc641ae.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
;
var _excluded = [
    "variant",
    "color",
    "size"
];
var Bold = function Bold(_ref) {
    var color = _ref.color;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M11.01 20.02a9.01 9.01 0 1 0 0-18.02 9.01 9.01 0 0 0 0 18.02ZM21.99 18.95c-.33-.61-1.03-.95-1.97-.95-.71 0-1.32.29-1.68.79-.36.5-.44 1.17-.22 1.84.43 1.3 1.18 1.59 1.59 1.64.06.01.12.01.19.01.44 0 1.12-.19 1.78-1.18.53-.77.63-1.54.31-2.15Z",
        fill: color
    }));
};
var Broken = function Broken(_ref2) {
    var color = _ref2.color;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M11 2a9 9 0 1 1-4.07.97M19.071 20.97c.53 1.6 1.74 1.76 2.67.36.86-1.28.3-2.33-1.24-2.33-1.15 0-1.79.89-1.43 1.97Z",
        stroke: color,
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
    }));
};
var Bulk = function Bulk(_ref3) {
    var color = _ref3.color;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        opacity: ".4",
        d: "M11.01 20.02a9.01 9.01 0 1 0 0-18.02 9.01 9.01 0 0 0 0 18.02Z",
        fill: color
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M21.99 18.95c-.33-.61-1.03-.95-1.97-.95-.71 0-1.32.29-1.68.79-.36.5-.44 1.17-.22 1.84.43 1.3 1.18 1.59 1.59 1.64.06.01.12.01.19.01.44 0 1.12-.19 1.78-1.18.53-.77.63-1.54.31-2.15Z",
        fill: color
    }));
};
var Linear = function Linear(_ref4) {
    var color = _ref4.color;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M11 20a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM18.93 20.69c.53 1.6 1.74 1.76 2.67.36.85-1.28.29-2.33-1.25-2.33-1.14-.01-1.78.88-1.42 1.97Z",
        stroke: color,
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
    }));
};
var Outline = function Outline(_ref5) {
    var color = _ref5.color;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M11 20.75c-5.38 0-9.75-4.37-9.75-9.75S5.62 1.25 11 1.25s9.75 4.37 9.75 9.75-4.37 9.75-9.75 9.75Zm0-18c-4.55 0-8.25 3.7-8.25 8.25s3.7 8.25 8.25 8.25 8.25-3.7 8.25-8.25-3.7-8.25-8.25-8.25ZM20.16 22.79c-.08 0-.16-.01-.23-.02-.47-.06-1.32-.38-1.8-1.81-.25-.75-.16-1.5.25-2.07.41-.57 1.1-.89 1.89-.89 1.02 0 1.82.39 2.18 1.08.36.69.26 1.57-.31 2.42-.71 1.07-1.48 1.29-1.98 1.29Zm-.6-2.3c.17.52.41.78.57.8.16.02.46-.17.77-.62.29-.43.31-.74.24-.88s-.35-.29-.87-.29c-.31 0-.54.1-.67.27-.12.17-.14.43-.04.72Z",
        fill: color
    }));
};
var TwoTone = function TwoTone(_ref6) {
    var color = _ref6.color;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M11 20a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
        stroke: color,
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
    }), /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        opacity: ".4",
        d: "M18.93 20.689c.53 1.6 1.74 1.76 2.67.36.85-1.28.29-2.33-1.25-2.33-1.14-.01-1.78.88-1.42 1.97Z",
        stroke: color,
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
    }));
};
var chooseVariant = function chooseVariant(variant, color) {
    switch(variant){
        case 'Bold':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(Bold, {
                color: color
            });
        case 'Broken':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(Broken, {
                color: color
            });
        case 'Bulk':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(Bulk, {
                color: color
            });
        case 'Linear':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(Linear, {
                color: color
            });
        case 'Outline':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(Outline, {
                color: color
            });
        case 'TwoTone':
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(TwoTone, {
                color: color
            });
        default:
            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(Linear, {
                color: color
            });
    }
};
var SearchNormal = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(function(_ref7, ref) {
    var _ref7$variant = _ref7.variant, variant = _ref7$variant === void 0 ? 'Linear' : _ref7$variant, _ref7$color = _ref7.color, color = _ref7$color === void 0 ? 'currentColor' : _ref7$color, _ref7$size = _ref7.size, size = _ref7$size === void 0 ? '24' : _ref7$size, rest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$_rollupPluginBabelHelpers$2d$3bc641ae$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(_ref7, _excluded);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("svg", (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$_rollupPluginBabelHelpers$2d$3bc641ae$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["a"])({}, rest, {
        xmlns: "http://www.w3.org/2000/svg",
        ref: ref,
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none"
    }), chooseVariant(variant, color));
});
SearchNormal.displayName = 'SearchNormal';
;
}),
"[project]/client/node_modules/iconsax-reactjs/dist/esm/SearchNormal.js [app-client] (ecmascript) <export default as SearchNormal>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SearchNormal",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$SearchNormal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$iconsax$2d$reactjs$2f$dist$2f$esm$2f$SearchNormal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/iconsax-reactjs/dist/esm/SearchNormal.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=client_b4a66882._.js.map