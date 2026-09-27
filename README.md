# Platform UI Kit

Bộ design token, MUI theme và component React dùng chung cho các app tính toán trên platform, xây trên MUI 9 + Tailwind 4. App dùng kit có sẵn giao diện, hành vi và khả năng truy cập (a11y) thống nhất mà không phải tự làm lại style.

Trạng thái: ESLint và `tsc` strict pass, library build pass, 40 unit test (logic số, filter, theme, release notes) và 208 test Playwright (hành vi, bàn phím, a11y bằng axe, đổi theme) pass, không có lỗi console. CI (GitHub Actions, `.github/workflows/ci.yml`) chạy toàn bộ cho mỗi PR. Ở chế độ standard: label 12px, input 14px và cao 40px, button 16px, tab 14px, ô bảng 12px.

## Mục lục

1. [Yêu cầu](#yêu-cầu)
2. [Bắt đầu nhanh](#bắt-đầu-nhanh)
3. [Cấu trúc](#cấu-trúc)
4. [Cài vào app](#cài-vào-app)
5. [Dùng trong app](#dùng-trong-app)
6. [Đổi màu theo app](#đổi-màu-theo-app)
7. [Component](#component)
8. [Quy tắc hành vi](#quy-tắc-hành-vi)
9. [Bố cục 3 section](#bố-cục-3-section)
10. [Design token](#design-token)
11. [Sửa và mở rộng kit](#sửa-và-mở-rộng-kit)
12. [Đưa vào Nx workspace](#đưa-vào-nx-workspace)
13. [Quyết định thiết kế](#quyết-định-thiết-kế)
14. [Chưa có trong kit](#chưa-có-trong-kit)
15. [Thay đổi ở 0.5.1](#thay-đổi-ở-051)
16. [Thay đổi ở 0.5](#thay-đổi-ở-05)
17. [Thay đổi ở 0.4](#thay-đổi-ở-04)
18. [Thay đổi ở 0.3](#thay-đổi-ở-03)
19. [Thay đổi so với 0.1](#thay-đổi-so-với-01)

## Yêu cầu

| Công cụ / thư viện | Phiên bản |
| --- | --- |
| Node.js | 24 LTS (script `build-tokens.ts` chạy TypeScript trực tiếp, cần Node ≥ 22.18; khai báo trong `engines`) |
| pnpm | 12 |
| React | 19.3 trở lên (19.x) |
| `@mui/material`, `@mui/icons-material` | 9.4 |
| `@emotion/react`, `@emotion/styled` | 11.14 |
| Tailwind CSS, `@tailwindcss/vite` | 4.3 |
| `react-resizable-panels` | 4.x (bố cục 3 section) |
| `react-toastify` | 11 |
| `@tanstack/react-table` | 9.2 (logic của GridView, không kèm giao diện) |
| `clsx`, `tailwind-merge` | 2.1, 3.7 |
| `@fontsource-variable/inter` | 5.x (font Inter, SIL OFL 1.1, đi kèm kit) |
| TypeScript / Vite | 6.0 / 8.3 |

## Bắt đầu nhanh

```bash
pnpm install
pnpm tokens    # sinh src/theme/tokens.generated.css từ tokens.ts
pnpm dev       # showcase: http://localhost:5173
```

Showcase gồm thanh bên trái liệt kê component theo nhóm (trên mobile là ô "Go to page"), và mỗi nhóm là một trang:

| Trang | URL | Nội dung |
| --- | --- | --- |
| Overview | `/` | Danh sách mọi demo và các export mà demo đó trình bày, dùng để review |
| Theme builder | `/#/theme` | Chỉnh màu và cỡ chữ, kiểm tra tương phản, xuất/nhập file theme |
| Foundations | `/#/foundations` | Role color (theo brand đang chọn), thang màu, typography, radius, shadow, spacing, Box/Stack |
| Actions | `/#/actions` | Button (mọi variant, kích thước, trạng thái), IconButton, CloseButton, DropdownMenu |
| Forms | `/#/forms` | FormField (kèm `useFormField` cho control tự làm), TextInput, NumberInput, Select, Combobox, Checkbox/Switch, RadioGroup, OptionCardGroup |
| Overlays | `/#/overlays` | Tooltip, InfoTip/HelpPopover, Dialog (vị trí, chế độ đóng), ConfirmDialog, Toast |
| Navigation | `/#/navigation` | TopNav/NavMenu, Tabs, Accordion + expand/collapse all |
| Data display | `/#/data` | Card, DataTable, GridView, GridImageCell/GridLinkCell, Chip/Link/Divider |
| Feedback | `/#/feedback` | Alert, EmptyState, Spinner, LoadingIndicator, ErrorBoundary |
| Workspace | `/#/workspace` | SectionLayout, Section, VisualizationStage + ImageViewer, DropOverlay |
| Patterns | `/#/patterns` | Release notes: hộp thoại "What's new", giả lập cập nhật, bản nhúng trang Help, đổi ngôn ngữ |
| Utilities | `/#/utilities` | Ô thử các hàm số, tìm kiếm và theme |
| Workspace toàn màn hình | `/#workspace`, `/#workspace-columns` | Bố cục calculator đầy đủ: xếp dọc / cạnh nhau |

Link tới từng demo có dạng `/#/<trang>/<id>`, ví dụ `/#/data/grid-view`. Mỗi demo có mô tả ngắn về lúc nên dùng, các trạng thái, và đoạn code mẫu.

Góc phải thanh nav của showcase có ô chọn màu brand để thử cấu hình theme.

Các lệnh khác:

```bash
pnpm lint             # ESLint (typescript-eslint, react-hooks, cấm mã hex trong component)
pnpm typecheck        # tsc strict, gồm cả tests/unit và scripts (tsconfig.node.json)
pnpm test             # unit test logic thuần (node --test, không cần thư viện)
pnpm check            # lint + typecheck + test + build, giống job CI đầu tiên
pnpm test:e2e         # Playwright: hành vi từng component, bàn phím, axe, đổi theme (tự chạy dev server)
pnpm build            # build library ra dist/ (JS ESM + .d.ts + CSS)
pnpm build:showcase   # build trang showcase ra dist-showcase/
pnpm pack             # tạo tarball @platform/ui-x.y.z.tgz (tự chạy build)
```

## Cấu trúc

```
src/
├── tokens/tokens.ts               # NGUỒN DUY NHẤT: màu, font, radius, shadow, z-index, breakpoint, layout
├── theme/
│   ├── createPlatformTheme.ts     # MUI theme, style của platform cho các component MUI
│   ├── colors.ts                  # resolveColors(): màu app + màu phái sinh từ brand
│   ├── augmentation.ts            # type cho palette mở rộng và variant của Button
│   ├── PlatformThemeProvider.tsx  # CSS layer + ThemeProvider + CssBaseline + density + màu
│   ├── theme.css                  # Tailwind 4: thứ tự layer, animation, utility, variant
│   ├── tokens.generated.css       # sinh từ tokens.ts, KHÔNG sửa tay
│   └── fonts.css                  # font Inter (mã nguồn mở) từ @fontsource-variable/inter
├── components/                    # component cơ bản
│   └── workspace/                 # bố cục 3 section: SectionLayout, Section, VisualizationStage, ImageViewer
├── utils/cn.ts                    # cn() = twMerge(clsx(...))
├── utils/number.ts                # parse/format/step số, dùng cho NumberInput và validate của app
├── utils/useStableValue.ts        # giữ nguyên object/mảng truyền inline khi nội dung không đổi (nội bộ)
├── index.ts                       # entry: export mọi thứ ở trên
└── showcase/                      # trang demo, KHÔNG copy sang dự án
    ├── catalog.ts                 # danh sách trang/demo (nguồn cho thanh bên, Overview, test)
    ├── layout.tsx                 # DemoPage, DemoSection, Code, điều hướng theo hash
    └── pages/                     # mỗi nhóm một trang
scripts/
└── build-tokens.ts                # tokens.ts → tokens.generated.css
tests/
├── unit/                          # node --test
└── e2e/
    ├── harness/                   # trang test: mỗi component một fixture (#select, #dialog…)
    ├── components/                # spec theo nhóm: forms, buttons, navigation, overlays, display, smoke
    ├── showcase.spec.ts           # showcase: mọi export có demo, mọi trang render + axe, điều hướng, theme
    └── helpers.ts
vite.lib.config.ts, tsconfig.lib.json  # library build
tsconfig.node.json                 # typecheck tests/unit và scripts (code Node chạy trực tiếp)
eslint.config.js                   # ESLint
.github/workflows/ci.yml           # CI: lint, typecheck, unit test, build, e2e
public/
└── images/                        # logo SST, bản vẽ mẫu cho showcase
```

## Cài vào app

Package tên `@platform/ui`. Để `private: true` nên không bao giờ bị publish nhầm lên npm công khai. Chọn một trong ba cách:

| Cách | Lệnh trong app | Khi nào |
| --- | --- | --- |
| Tarball | `pnpm pack` trong kit, rồi `pnpm add ./path/platform-ui-0.5.1.tgz` | App ở repo khác, muốn khóa phiên bản |
| Link thư mục | `pnpm add link:../et-platform-ui-kit` (chạy `pnpm build` trong kit trước) | Sửa kit và app cùng lúc |
| Registry nội bộ | Bỏ `private`, thêm `publishConfig.registry`, rồi `pnpm publish` | Nhiều team dùng chung |

App tự cài các peer dependency: `react`, `react-dom` ≥ 19.3, `@mui/material`, `@mui/icons-material` ≥ 9.4, `@emotion/react`, `@emotion/styled` ≥ 11.14, `tailwindcss` 4 (khai báo dạng `^`, nên app nâng minor/patch không bị báo lỗi peer). Kit không tự mang theo các package này, nên cả app chỉ có một bản React, MUI và Emotion.

`theme.css` của kit tự khai báo `@source` tới code của kit, nên app không cần thêm `@source` khi cài từ package.

## Dùng trong app

**1. Import CSS và bọc app bằng provider**

```tsx
// main.tsx
import '@platform/ui/theme.css';
import { PlatformThemeProvider, ToastHost } from '@platform/ui';

createRoot(document.getElementById('root')!).render(
  <PlatformThemeProvider density={settings.density}>
    <App />
    <ToastHost />
  </PlatformThemeProvider>,
);
```

`PlatformThemeProvider` làm 4 việc:
- Bật CSS layer để utility của Tailwind thắng style của MUI mà không cần `!important`.
- Nạp MUI theme cùng `CssBaseline`.
- Ghi biến màu (`--color-*`) theo prop `colors`.
- Gắn class `density-standard` hoặc `density-expanded` lên `<body>`.

**2. Cấu hình Vite và Tailwind**

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react(), tailwindcss()] });
```

`theme.css` của kit đã có `@source "../"`, nên Tailwind quét được class của kit, cả khi dùng từ source (`src/`) lẫn khi cài package (`dist/`).

**3. Dùng component và token**

```tsx
import { Box, Button, FormField, NumberInput, colors } from '@platform/ui';

<FormField label="Design load" htmlFor="load" help="Factored load applied to the connection." error={loadError}>
  <NumberInput value={load} onChange={setLoad} min={0} addonAfter="lbs" />
</FormField>
<Button variant="primary" loading={isCalculating}>Calculate</Button>
<div className="flex gap-2 bg-surface-app p-2">…</div>   // class Tailwind từ token
<Box sx={{ color: colors.danger }}>…</Box>               // token trong TS (= var(--color-danger))
```

Mọi thứ app cần đều import từ `@platform/ui`, gồm cả `Box`, `Stack`, `Typography`, `Divider`, `Link`, `Chip`, `Tooltip`. Không import trực tiếp `@mui/*` trong app.

## Đổi màu theo app

### Cách nhanh nhất: Theme builder

1. `pnpm dev`, mở `/#/theme`.
2. Chọn màu brand (các sắc độ hover/active/subtle/focus tự tính). Nếu cần, bật "Show all roles" để chỉnh từng role. Mọi thay đổi áp lên toàn bộ showcase ngay, nên mở các trang khác để xem kết quả. Cấu hình được giữ khi tải lại trang.
3. Xem bảng **Contrast check** (WCAG AA) và sửa các cặp màu bị Fail nếu sản phẩm cần đạt AA.
4. **Export**: tải `theme.config.ts` (hoặc `theme.json`). File chỉ chứa phần đã chỉnh, phần còn lại vẫn theo mặc định của kit.
5. Lưu file vào app và truyền vào provider:

```tsx
// apps/demo-calc/src/theme.config.ts  (file export từ builder)
import { definePlatformTheme } from '@platform/ui';
export default definePlatformTheme({ version: 1, name: 'Demo Calculator', colors: { brand: '#1f5f99' } });

// apps/demo-calc/src/main.tsx
import theme from './theme.config';
<PlatformThemeProvider config={theme} density={userSettings.density}>   // prop riêng đè lên config
```

Muốn sửa sau này: mở builder, **Import** file của app, chỉnh, rồi export lại.

Theme tải lúc chạy (vd. theo khách hàng, từ API) thì kiểm tra trước bằng `parseThemeConfig`: màu sai là lỗi, key lạ bị bỏ qua kèm cảnh báo.

```ts
const result = parseThemeConfig(await fetch('/theme.json').then((r) => r.text()));
const theme = result.ok ? result.config : {};   // lỗi thì dùng mặc định của kit
```

| API | Dùng để |
| --- | --- |
| `PlatformThemeConfig` | `{ version: 1, name?, colors?, density? }`: dạng JSON thuần |
| `definePlatformTheme(config)` | Viết `theme.config.ts` có kiểm tra kiểu |
| `PlatformThemeProvider config` | Áp theme; `colors`/`density` truyền riêng sẽ đè lên |
| `parseThemeConfig(input)` | Kiểm tra JSON không tin cậy: `{ ok, config, warnings }` hoặc `{ ok: false, errors }` |
| `themeConfigToJson`, `themeConfigToTs`, `normalizeThemeConfig` | Xuất file (chỉ phần đã chỉnh) |
| `contrastRatio(fg, bg)`, `isValidColor`, `parseRgb`, `COLOR_ROLES` | Kiểm tra màu, tương phản WCAG, danh sách role |

### Chỉnh trực tiếp bằng code

```tsx
<PlatformThemeProvider colors={{ brand: '#1565c0' }}>          // chỉ cần brand
<PlatformThemeProvider colors={{ brand: '#1565c0', danger: '#c62828', surfaceApp: '#f5f7fa' }}>
```

- `colors` nhận bất kỳ role nào trong `defaultColors` (xem [Design token](#design-token)).
- Chỉ truyền `brand` là đủ: `brandHover`, `brandActive`, `brandDark`, `brandSubtle`, `brandSelected`, `focusRing`, `accent`, `selection` và `scrollbarThumb` được tính từ nó. Role nào truyền tường minh sẽ thắng giá trị tính ra.
- Màu đổi được lúc chạy, không cần build lại. Style MUI, class Tailwind (`bg-brand`, `border-accent`…) và `colors.*` trong `sx` đều theo cùng một biến CSS.
- Muốn biết giá trị hex đã tính (ví dụ để vẽ chart), dùng `resolveColors({ brand })`.

Nguyên tắc để màu đổi được: component chỉ dùng `colors.*` (là `var(--color-*)`) hoặc class Tailwind theo role. Không dùng hex và không dùng thang `pumpkinOrange` cho phần tử mang màu thương hiệu. Vì `colors.*` là biến CSS, hàm `alpha()` của MUI không dùng được với nó; thay bằng `color-mix(in srgb, ${colors.success} 15%, transparent)`.

## Component

Style của hầu hết component nằm trong theme (`createPlatformTheme.ts`), nên cả component MUI gốc như `TextField`, `Select`, `Autocomplete`, `Menu` cũng có giao diện của platform. Wrapper trong kit chỉ thêm API tiện dùng.

### Nút và hộp thoại

| Component | Ghi chú |
| --- | --- |
| `Button` | Variant: `primary`, `primaryDark`, `secondary`, `default` (mặc định), `tertiary`, `text`, `textDark`, `danger`, `fab`. Size: `small`, `medium`. `loading` hiện spinner và chặn click |
| `IconButton`, `CloseButton` | `IconButton` bắt buộc `aria-label` (kiểm tra ở mức type) |
| `DropdownMenu` | Nút mở danh sách hành động; item có `icon`, `danger`, `divider` |
| `Dialog`, `DialogHeader`, `DialogBody`, `DialogFooter` | `placement="top"` (mặc định) hoặc `"center"`. `dismissible`: `any` / `escape` / `none`. `onClose(reason)` |
| `ConfirmDialog` | Xác nhận trước khi xóa/reset. `destructive` = nút đỏ và focus sẵn ở Cancel. `loading` = khóa dialog |
| `Tooltip` | **Hover, chữ ngắn** (1–2 dòng, chỉ chữ): nhãn cho icon button, gợi ý một dòng. Mở sau 300ms (100ms giữa các nút cạnh nhau), khi focus bằng bàn phím, khi nhấn giữ trên màn hình cảm ứng. Rê chuột vào tooltip thì tooltip không biến mất, Escape để đóng. Chữ 12px, rộng tối đa 320px. Dùng được trên nút disabled |
| `InfoTip` | **Click, giải thích dài** (nhiều đoạn, danh sách, link). Mở bằng click/Enter/Space thành một dialog nhỏ; focus đi vào trong nên link bấm được; Escape, click ra ngoài hoặc nút X để đóng, focus trả về nút đã mở. `title` in đậm và đặt tên cho dialog. `trigger`: `'help'` (nút "?" màu brand, mặc định), `'info'` (icon "i") hoặc phần tử tùy chọn như `<Button variant="text">Why?</Button>`. `placement`, `maxWidth` (mặc định 360px); nội dung dài cuộn sau 384px |
| `HelpPopover` | Alias của `InfoTip` với nút "?" (giữ cho code cũ và `FormField help`) |
| `notify.success/info/warning/error/dismiss`, `ToastHost` | react-toastify (bản `unstyled`: CSS nằm trong `@layer components` của `theme.css`, nên class Tailwind ghi đè được). Lỗi ở lại tới khi đóng tay, cảnh báo 8s, còn lại 5s; dừng khi rê chuột. App không import `react-toastify` trực tiếp: `notify` và `ToastHost` phải dùng chung một bản |

Chọn loại tooltip:

```tsx
// Hover: ngắn, chỉ chữ
<Tooltip title="Reset view">
  <IconButton aria-label="Reset view"><RestartAltIcon /></IconButton>
</Tooltip>

// Click: giải thích dài, có cấu trúc
<InfoTip title="How capacity is calculated">
  <p>Capacity is the lowest of the fastener and member limits.</p>
  <ul><li>Fastener: withdrawal and lateral</li><li>Members: bearing</li></ul>
  <p>See the <a href="/guide">design guide</a>.</p>
</InfoTip>
```

```tsx
<Dialog open={open} onClose={close}>
  <DialogHeader onClose={close}>Save as template</DialogHeader>
  <DialogBody>…</DialogBody>
  <DialogFooter>
    <Button onClick={close}>Cancel</Button>
    <Button variant="primary">Save</Button>
  </DialogFooter>
</Dialog>
```

### Form

| Component | Ghi chú |
| --- | --- |
| `FormField` | Label 12px, `required` = label đỏ có `*`, `help` = nút "?", `description` = gợi ý xám, `error` = chữ đỏ 12px, `disabled`. Tự nối label/mô tả/lỗi vào control bên trong |
| `TextInput` | Cao 40px, `addonBefore`/`addonAfter` cho đơn vị. `multiline minRows={3}` cho textarea |
| `NumberInput` | `value: number \| null`, `min`, `max`, `step`, `precision`, `clampBehavior`. Xem [NumberInput](#numberinput) |
| `Select` | Chọn một hoặc nhiều (`multiple`), option có `image`, `note`, `disabled` |
| `Combobox` | MUI Autocomplete. Option có label không phải chuỗi thì thêm `searchText` |
| `Checkbox`, `Switch` | `onChange(checked: boolean)` |
| `RadioGroup` | Giữ nguyên kiểu giá trị (number, boolean), `direction="row" \| "column"` |
| `OptionCardGroup` | Thẻ chọn có ảnh, dấu check cam ở thẻ đang chọn |

```tsx
<FormField label="Connection type" htmlFor="connection">
  <Select
    value={connection}
    onChange={setConnection}
    options={[
      { value: 'wood', label: 'Wood to Wood', note: 'most common' },
      { value: 'steel', label: 'Wood to Steel', image: '/img/steel.png' },
    ]}
  />
</FormField>
```

Trong `FormField`, control không cần `id`: nó lấy `htmlFor` của field. Ngoài `FormField` thì truyền `aria-label`.

#### NumberInput

Dùng cho mọi input số trong app tính toán, thay cho `TextInput` và `<input type="number">`.

```tsx
const [thickness, setThickness] = useState<number | null>(1.5);

<FormField
  label="Member thickness"
  htmlFor="thickness"
  required
  description="1.5 to 3.5 in."
  error={thickness === null ? 'Required.' : !isInRange(thickness, { min: 1.5, max: 3.5 }) ? 'Must be between 1.5 and 3.5 in.' : undefined}
>
  <NumberInput value={thickness} onChange={setThickness} min={1.5} max={3.5} step={0.25} precision={3} addonAfter="in" />
</FormField>
```

| Tình huống | Hành vi |
| --- | --- |
| Gõ chữ, `e`, dấu cách, dấu phân cách hàng nghìn | Không nhận |
| Gõ `,` | Hiểu là dấu thập phân (`2,5` → `2.5`) |
| Gõ `-` khi `min >= 0`, gõ quá `precision` chữ số thập phân | Không nhận |
| Ô trống | `onChange(null)`, không bao giờ là `0`, `NaN` hay `''` |
| Đang gõ dở (`-`, `.`) | Chưa gọi `onChange`. Khi blur thì quay về giá trị cũ |
| Mũi tên lên/xuống | Tăng/giảm `step` (Shift ×10), kẹp trong `[min, max]`, không bị sai số (`0.1+0.2` = `0.3`) |
| Cuộn chuột | Không đổi giá trị |
| Giá trị ngoài `[min, max]` | Mặc định giữ nguyên và báo lỗi (`aria-invalid`, viền đỏ) để app hiện thông báo. `clampBehavior="blur"` thì kẹp lại khi blur |
| Có `precision` | Làm tròn khi blur (half away from zero), hiển thị đủ số chữ số |
| Trình đọc màn hình | Role `spinbutton` có `aria-valuemin/max/now` |

Các hàm `parseNumber`, `roundTo`, `stepNumber`, `isInRange`, `formatNumber` cũng được export để app dùng khi validate hoặc tính toán.

### Hiển thị và điều hướng

| Component | Ghi chú |
| --- | --- |
| `Tabs`, `Tab`, `TabPanel` | Thanh tab xám, tab đang chọn màu cam. Truyền `id` cho `Tabs` và `tabsId` cho `TabPanel` để nối tab với panel |
| `Accordion` | Header xám nhạt, mũi tên cam xoay 90° khi mở. `headingLevel` (mặc định `h3`) |
| `useAccordionGroup`, `ExpandCollapseAllButton` | Giữ trạng thái chung cho nhiều Accordion: `<Accordion {...group.item('loads')} />`, nút đặt ở `Section actions` |
| `Alert` | `severity`, `title`, nội dung 12px |
| `DataTable` + `.Head/.Body/.Footer/.Row/.Cell` | Ô 12px, header đậm cao 48px; kết hợp `@tanstack/react-table` để sort, filter |
| `LoadingIndicator` | Vòng cam nhấp nháy "Updating Results", phủ cả khung |
| `Spinner` | Vòng xoay nhỏ inline, theo màu chữ |
| `Card` | Header nền xám, tiêu đề bold (`title`, `subtitle`, `actions`), `footer`. `padding`: `sm` (8px, mặc định), `md` (12px), `none` (đặt bảng sát viền, tự bỏ viền đôi) |
| `EmptyState` | Khung trống: "No results yet" + nút hành động |
| `ErrorBoundary` | Lỗi render trong một khung không làm trắng cả app. `resetKeys`, `fallback`, `onError` |
| `Box`, `Stack`, `Typography`, `Divider`, `Link`, `Chip` | Re-export từ MUI, đã có style theo theme |
| `TopNav`, `NavMenu` | Thanh cao 54px, gạch chân cam 4px khi hover/mở |

### GridView

Bảng dữ liệu cho kết quả tính toán, tương tự ag-grid nhưng dùng giao diện và theme của kit. Phần state (sort, filter, thứ tự cột, cố định cột) do `@tanstack/react-table` v9 xử lý; markup, style và hành vi bàn phím là của kit.

```tsx
const columns: GridColumn<Fastener>[] = [
  { id: 'model', header: 'Model', value: 'model', type: 'image', width: 220,
    image: { src: (r) => r.imageUrl, subtext: (r) => r.description } },
  { id: 'material', header: 'Material', value: 'material', filter: 'select' },
  { id: 'capacity', header: 'Capacity', value: 'capacity', type: 'number',
    format: (v) => `${(v as number).toLocaleString('en-US')} lbs` },
  { id: 'sheet', header: 'Datasheet', value: (r) => `${r.model}.pdf`, type: 'link',
    link: { href: (r) => r.datasheetUrl, external: true }, filter: false, sortable: false },
  { id: 'details', header: 'Details', value: () => 'View', type: 'link',
    link: { onClick: (r) => openDetails(r) }, filter: false, sortable: false, searchable: false },
];

<GridView
  aria-label="Fastener results"
  rows={fasteners}
  columns={columns}
  getRowId={(r) => r.id}
  search={{ placeholder: 'Search model, material…', columns: ['model', 'material'] }}
  presets={[
    { id: 'high', label: 'Capacity ≥ 1,000 lbs', filters: { capacity: { min: 1000 } } },
    { id: 'wood', label: 'Wood only', filters: { material: ['Wood'] } },
  ]}
  rowHighlight={(r) => (r.status === 'Fails' ? 'danger' : r.status === 'Check' ? 'warning' : undefined)}
  selectedRowId={selectedId}
  onRowClick={(r) => setSelectedId(r.id)}
  initialState={savedLayout ?? { pinned: { start: ['model'], end: ['details'] } }}
  onStateChange={saveLayout}          // lưu vào localStorage/settings nếu muốn
  maxHeight={400}
  toolbar={<Button size="small">Export</Button>}
/>
```

**Cấu hình cột (`GridColumn`)**

| Thuộc tính | Ý nghĩa |
| --- | --- |
| `id`, `header` | Id ổn định (dùng trong state, preset) và tên cột |
| `value` | Tên field hoặc hàm trả giá trị. Giá trị này dùng để sort, filter, search. Chuỗi rỗng, `null`, `NaN` được coi là rỗng: hiện `—` và luôn nằm cuối khi sort |
| `type` | `text` (mặc định), `number` (căn phải, chữ số đều, filter khoảng, dấu phân cách nghìn), `image` (ảnh + chữ, cần `image`), `link` (cần `link`) |
| `cell` | Tự render nội dung bất kỳ. Sort, filter, search vẫn dựa trên `value` |
| `format`, `precision` | Chữ hiển thị (vd. thêm đơn vị); master search tìm trên chữ này |
| `image` | `{ src, alt?, subtext? }`: ảnh lazy load, dòng phụ màu xám |
| `link` | `{ href, external? }`: thẻ `<a>` thật (mở tab mới an toàn khi `external`); hoặc `{ onClick }`: nút trông như link cho hành động trong app |
| `width`, `align` | Rộng cố định (mặc định 160, số 120) để cột cố định thẳng hàng |
| `sortable`, `filter`, `filterOptions`, `searchable`, `hideable` | Bật/tắt từng tính năng. `filter`: `text` / `number` / `select` / `false`. `select` tự lấy các giá trị khác nhau trong dữ liệu nếu không có `filterOptions` |

**Hành vi**

| Tính năng | Chuẩn áp dụng |
| --- | --- |
| Sort | Bấm tiêu đề: tăng → giảm → bỏ sort (mọi cột, kể cả số, bắt đầu từ tăng dần). Shift+click để sort thêm cột (có số thứ tự). `aria-sort` trên tiêu đề. Giá trị rỗng luôn cuối |
| Filter theo cột | Hàng filter dưới tiêu đề: chữ (chứa, không phân biệt hoa thường/dấu), khoảng số (bao gồm hai đầu), chọn nhiều giá trị. Có số dòng "x of y rows" và nút Clear filters |
| Ẩn/hiện hàng filter | Nút **Filters** (`aria-pressed`). Khi ẩn, filter đang có vẫn áp dụng; nút hiện số filter đang bật, và "x of y rows" + Clear filters vẫn hiện. Hiện lại thì giá trị còn nguyên. Mặc định hiện; `initialState={{ filtersVisible: false }}` để ẩn lúc đầu. `columnFilters={false}` tắt hẳn filter theo cột |
| Master search | Mọi từ phải xuất hiện, ở bất kỳ cột nào ("wood 1,450"). Không phân biệt hoa thường và dấu tiếng Việt ("be tong" tìm được "Bê tông"). `search.columns` giới hạn cột được tìm. Escape để xóa |
| Preset | Chip bấm một lần để áp bộ filter + search định sẵn; bấm lại để bỏ. Sửa filter bằng tay thì chip tự bỏ chọn |
| Đổi vị trí cột | Kéo thả tiêu đề (tay cầm hiện khi rê chuột), hoặc menu cột → Move left/right cho bàn phím. Chỉ đổi trong cùng vùng (trái cố định / giữa / phải cố định) |
| Cố định cột | Menu cột → Freeze left / Freeze right / Unfreeze. Cột cố định đứng yên khi cuộn ngang, có đường phân cách |
| Ẩn/hiện cột | Menu cột → Hide column; nút Columns để bật lại. Không ẩn được cột cuối cùng. Reset layout đưa về ban đầu |
| Highlight | `rowHighlight` tô `success`/`warning`/`danger`/`info`; `selectedRowId` tô dòng đang chọn + vạch màu brand, `aria-current` |
| Click dòng | `onRowClick`: dòng focus được, Enter/Space để chọn. Bấm link/nút trong dòng không kích hoạt click dòng |
| Cuộn | Tiêu đề và hàng filter dính trên cùng; vùng cuộn focus được bằng bàn phím. Grid luôn rộng theo khung chứa, bảng rộng thì cuộn bên trong (không làm tràn trang) |
| Lưu layout | `onStateChange` trả `{ sort, filters, search, columnOrder, pinned, hidden, filtersVisible }`; truyền lại qua `initialState` |

| Ngôn ngữ | `labels` ghi đè bất kỳ chữ nào (toolbar, menu, filter, số dòng, nhãn cho trình đọc màn hình); phần còn lại lấy từ `defaultGridViewLabels`. Ví dụ `labels={{ clearFilters: 'Xóa bộ lọc', rowCount: (n, total, filtered) => filtered ? `${n}/${total} dòng` : `${total} dòng` }}` |

Giới hạn: render mọi dòng (không virtualization), phù hợp tới vài nghìn dòng. Chưa có kéo đổi độ rộng cột, nhóm dòng, sửa trực tiếp trong ô.

### Release notes

Mọi app đều cần "What's new". Kit lo giao diện và hành vi; app chỉ cung cấp dữ liệu (thường là một file JSON) và quyết định mở từ đâu.

```tsx
const seen = useReleaseNotesSeen({ currentVersion: APP_VERSION, storageKey: 'demo-calc:release-notes' });

<ReleaseNotesDialog
  open={seen.shouldOpen || helpMenuOpen}
  onClose={() => { seen.markSeen(); setHelpMenuOpen(false); }}
  appName="DC"
  appTitle="Demo Calculator"
  intro="Demo Calculator checks timber connections…"
  releases={releases}
  lastSeenVersion={seen.lastSeenVersion}
/>
```

Dữ liệu (`ReleaseNote[]`):

```ts
[{
  version: '2.5.0',
  date: '2026-09-03',                       // đọc theo ngày địa phương
  sections: [
    { category: 'feature', groups: [
      { title: 'EU', items: ['Added Chile as a supported country.', <>Added Multi-Ply — <Link …>Explore now</Link></>] },
      { title: 'USA', items: ['Added a results filter…'] },
    ] },
    { category: 'improvement', groups: [{ items: ['General UI/UX enhancements.'] }] },
    { category: 'maintenance', groups: [{ items: ['General system improvements and bug fixes.'] }] },
  ],
}]
```

| Thành phần | Hành vi |
| --- | --- |
| `ReleaseNotesDialog` | Header: tên viết tắt màu brand + tên đầy đủ; đoạn giới thiệu; danh sách; nút Close. Rộng tối đa 56rem, nội dung cuộn giữa header và footer |
| `ReleaseNotes` | Danh sách dùng riêng (vd. trang Help). Sắp xếp mới nhất trước **theo semver** (2.10.0 đứng trước 2.9.0, bản beta đứng trước bản chính thức). `defaultExpanded`: `latest` (mặc định) / `all` / `none`. Nút expand/collapse all khi có từ 2 bản |
| Loại thay đổi | `feature`, `improvement`, `fix`, `maintenance`, `security`, `deprecation`: nhãn màu có icon, màu theo role token. Mỗi loại gồm các nhóm: có `title` thì là tiêu đề đậm + gạch đầu dòng; không có tiêu đề và chỉ một dòng thì là một đoạn văn |
| Ngày | `"YYYY-MM-DD"` đọc theo ngày địa phương, nên không bị lùi một ngày ở múi giờ Mỹ như `new Date('…')`. `locale` để đổi định dạng (vd. `vi-VN`) |
| Nhãn "New" | Các bản mới hơn `lastSeenVersion` |
| `useReleaseNotesSeen` | Lưu phiên bản đã xem trong localStorage. `shouldOpen` = app vừa được cập nhật (tự mở một lần). Lần truy cập đầu tiên không mở, chỉ ghi lại phiên bản (`showOnFirstVisit` để đổi). `markSeen()` khi đóng. Không lỗi khi localStorage bị chặn |
| Dịch | `labels`: một phần bất kỳ, vd. `{ released: (d) => \`Phát hành ngày ${d}\`, categories: { feature: 'Tính năng mới' } }` |
| Heading | Mỗi bản là heading (`headingLevel`, mặc định `h3`); loại và nhóm là các cấp tiếp theo, nên trình đọc màn hình duyệt được |

Hàm dùng kèm: `compareVersions`, `sortReleases`, `formatReleaseDate`, `parseReleaseDate`.

## Quy tắc hành vi

Kit đã áp dụng sẵn các quy tắc dưới đây. Component mới cũng phải theo đúng các quy tắc này.

| Quy tắc | Cách kit làm |
| --- | --- |
| Không submit form ngoài ý muốn | `Button` mặc định `type="button"`. Submit thì ghi rõ `type="submit"` |
| Không bấm hai lần khi đang xử lý | `Button loading` chặn click. `ConfirmDialog loading` khóa cả dialog |
| Thấy được focus khi dùng bàn phím (WCAG 2.4.7) | Kit tắt ripple, nên mọi control có viền `2px` màu brand khi `:focus-visible` |
| Disabled phải trông "tắt" | Mờ 40%, con trỏ `not-allowed`, không bao giờ đậm hơn trạng thái bình thường |
| Lỗi gắn vào đúng field | `FormField` đặt `aria-invalid`, `aria-describedby` (mô tả + lỗi), `required`, `aria-labelledby` cho TextInput, NumberInput, Select, Combobox, RadioGroup |
| Lỗi validate hiện cạnh field, không hiện bằng toast | Toast chỉ dùng cho kết quả của một hành động. Toast lỗi ở lại tới khi đóng tay (WCAG 2.2.1) |
| Không mất dữ liệu vì lỡ tay | `ConfirmDialog` cho xóa/reset. Dialog có form dùng `dismissible="escape"` để click ra ngoài không đóng dialog |
| Hành động nguy hiểm dùng mặc định an toàn | `ConfirmDialog destructive`: nút đỏ, focus sẵn ở Cancel |
| Dialog giữ focus bên trong | MUI trap focus, Escape để đóng, đóng xong trả focus về nút đã mở dialog |
| Lỗi render cục bộ | Bọc mỗi section bằng `ErrorBoundary` |
| Nút chỉ có icon có tên | `IconButton` bắt buộc `aria-label` ở mức type |
| Tooltip đúng loại | Chữ ngắn → `Tooltip` (hover). Nội dung dài, có link hoặc danh sách → `InfoTip` (click). Không đặt link hay nội dung bấm được trong `Tooltip`, vì người dùng bàn phím và cảm ứng không với tới được |
| Thứ bậc chữ nhất quán | Tiêu đề (Card, Dialog, Accordion, EmptyState, Alert, đầu bảng, `Typography h1–h6`) = **bold**; label = medium; nội dung = regular. `h1`–`h6` theo thang gọn cho app công cụ (24 → 12px), không dùng thang mặc định 96px của MUI |
| Khoảng cách theo nhịp 8px | Padding của Card, Dialog, Accordion, ô bảng đều 0.5rem; khoảng cách giữa các field 0.5–0.75rem |
| Kích thước menu thống nhất | Menu hành động (DropdownMenu, NavMenu, MUI `Menu`) rộng 160–320px (`layout.menuMinWidth/MaxWidth`); nhãn dài xuống dòng, không bị cắt. Item cao tối thiểu 36px, 48px trên màn hình cảm ứng. Dropdown của Select rộng bằng ô Select |
| Chữ và icon thẳng hàng | Inter có ascent/descent cân đối nên chữ hoa nằm đúng giữa hộp dòng; mọi cặp icon + chữ căn `center` (checkbox, radio, switch, icon trong nút) là thẳng hàng mà không cần chỉnh riêng |

### Test hành vi

Mỗi component có một fixture trong `tests/e2e/harness/fixtures.tsx` (mở bằng `pnpm dev` rồi vào `/tests/e2e/harness/index.html#<tên>`). Fixture in ra giá trị mà callback nhận được (`<output data-testid>`), nên test kiểm tra được cả kiểu dữ liệu, ví dụ `2` khác `"2"`.

| Nhóm | Những gì được kiểm tra |
| --- | --- |
| Tất cả fixture (`smoke`) | Không có lỗi console, không vi phạm axe (trừ `color-contrast`) |
| Button | Click / Enter / Space; disabled và `loading` chặn click; không submit form nếu không phải `type="submit"`; Enter trong input submit form; viền focus chỉ hiện khi dùng bàn phím |
| TextInput + FormField | `required`, mô tả và lỗi nối vào input; lỗi được đọc (`role="alert"`) và bỏ khi hết lỗi; textarea giữ xuống dòng; disabled |
| NumberInput | Spinbutton có min/max/now; chỉ trả số hoặc `null`; không gọi `onChange` khi blur không đổi; theo giá trị app đặt; Shift+mũi tên ×10 có kẹp; `precision`; readOnly, disabled |
| Select | Placeholder, label, mô tả; bàn phím mở/chọn/bỏ qua option disabled/trả focus; giữ kiểu số; Escape không đổi giá trị; chọn nhiều; dropdown rộng bằng ô |
| Combobox | Lọc khi gõ; chọn bằng bàn phím; "không có kết quả"; option disabled; `searchText`; nút Clear về `null`; Escape |
| Checkbox, Switch, Radio | Click label, Space; role `switch`; disabled; radio nhận tên từ FormField, mũi tên bỏ qua option disabled, giữ kiểu số/boolean |
| OptionCardGroup | `aria-pressed`; bấm lại thẻ đang chọn không thành `null`; thẻ disabled; Space |
| Tabs | Tab ↔ panel nối bằng id; mũi tên/Home/End bỏ qua tab disabled; `keepMounted` giữ state |
| Accordion | Click/Enter/Space; header nằm trong heading, `aria-controls` trỏ tới đúng một region; controlled; expand/collapse all |
| DropdownMenu, NavMenu | `aria-haspopup`/`aria-expanded`; bàn phím mở, bỏ qua item disabled, chọn, trả focus; Escape; rộng 160–320px, nhãn dài xuống dòng, item ≥ 36px (48px cảm ứng) |
| Dialog | Tên từ tiêu đề; giữ focus bên trong; Escape trả focus; từng chế độ `dismissible` và `reason` |
| ConfirmDialog | Focus nút Confirm; khi `loading` không đóng được và không xác nhận hai lần; Cancel |
| Tooltip | Hiện khi hover (có độ trễ, không nháy) và khi focus bàn phím; rê chuột vào tooltip không làm mất; Escape đóng; chỉ mô tả, không đổi tên nút; hiện trên nút disabled; chữ nhỏ, giới hạn độ rộng |
| InfoTip, HelpPopover | Không mở khi hover; click/Enter mở dialog có tên; focus vào trong, Tab tới được link; Escape, click ra ngoài, nút X đóng và trả focus; trigger `info` và trigger tùy chọn; giới hạn rộng, cuộn khi dài |
| Toast | Mỗi loại được đọc; success tự đóng, error ở lại; hover dừng timer; nút đóng, dismiss all; tối đa 5 toast |
| Alert, Card, DataTable, EmptyState, Spinner, LoadingIndicator | Role đúng (`alert`/`status`/`progressbar`); heading của Card; bảng có header, vùng cuộn focus được bằng bàn phím, header dính |
| ErrorBoundary | Lỗi bị chặn trong khung, báo qua `onError`, thử lại vẫn lỗi nếu dữ liệu chưa sửa, `resetKeys` khôi phục |
| ImageViewer | Nút zoom trong giới hạn; nút zoom vẫn chạy khi đang zoom; bấm nhanh không reset; cuộn chuột không cuộn trang; double-click và `ref.reset()`; `minScale` < 1; đổi `src` reset view; pinch hai ngón |
| SectionLayout | 3 khung có thanh kéo; kéo Input nhỏ quá thì thu thành thanh dọc và mở lại được (tên nút chứa nhãn hiển thị); vẫn chạy khi localStorage bị chặn; mobile: mỗi lần một khung, Input giữ dữ liệu |
| Density | Đổi class trên `<body>` và cỡ chữ 14 ↔ 16px |
| Theme builder | Brand áp lên mọi trang và tự tính sắc độ; file export chỉ chứa phần đã chỉnh; màu sai bị báo và không được áp; ghi đè/reset từng role; bảng tương phản cập nhật theo màu; cỡ chữ; giữ khi tải lại, Reset; xuất TS và tải file; nhập file/JSON có lỗi và cảnh báo |
| Release notes | Tên app và giới thiệu; tiêu đề dialog không bị viết hoa; sắp xếp theo semver, bản mới nhất mở; ngày không lệch múi giờ; nhãn New; loại/nhóm/gạch đầu dòng/dòng lẻ/link; expand/collapse all; heading không có margin thừa; Close/Escape trả focus; dịch nhãn và ngày; danh sách rỗng; `useReleaseNotesSeen` lần đầu / sau cập nhật / markSeen |
| GridView | Kiểu cell (số, rỗng, ảnh, link ngoài an toàn); highlight; sort tăng/giảm/bỏ, rỗng luôn cuối, sort nhiều cột, bàn phím, menu; filter chữ/khoảng số/chọn nhiều, "không có kết quả"; ẩn/hiện hàng filter (filter vẫn áp dụng, badge đếm, giữ giá trị); master search nhiều từ, bỏ dấu, giới hạn cột, Escape; preset bật/tắt; `labels` dịch chữ; cố định trái/phải và đứng yên khi cuộn; đổi vị trí bằng menu và kéo thả; ẩn/hiện, reset layout; tiêu đề dính; chọn dòng bằng click/Enter; link trong dòng không kích hoạt dòng |

Thêm component mới thì thêm fixture, thêm tên vào `fixtureNames` trong `tests/e2e/helpers.ts`, và viết spec cho các hành vi của nó.

## Bố cục 3 section

Bố cục chuẩn của một app tính toán: **Input** bên trái, **Illustration** (3D, 2D, ảnh) và **Output** bên phải.

```tsx
<Workspace>
  <SectionLayout
    layoutId="demo-calc"        // lưu kích thước panel vào localStorage; bỏ để không lưu
    secondarySplit="rows"       // rows = xếp dọc, columns = cạnh nhau (cho người dùng chọn trong setting)
    labels={{ input: 'Input', illustration: '3D', output: 'Output' }}
    input={
      <Section title="Input" actions={<IconButton aria-label="Collapse all">…</IconButton>}>
        <InputForm />
      </Section>
    }
    illustration={
      <Section value={tab} onChange={setTab} tabs={[
        { value: '3d', label: '3D Viewer', content: <ThreeDView /> },
        { value: '2d', label: '2D Drawing', content: <DrawingView /> },
      ]} />
    }
    output={<Section title="Output"><ResultsTable /></Section>}
    mobileTabs={[                // mobile: một thanh tab phẳng, dùng body không có header
      { value: 'input', label: 'Input', content: <InputForm />, keepMounted: true },
      { value: '3d', label: '3D', content: <ThreeDView /> },
      { value: 'output', label: 'Output', content: <ResultsTable />, keepMounted: true },
    ]}
  />
</Workspace>
```

**Hành vi theo màn hình**

| Màn hình | Hành vi |
| --- | --- |
| Desktop ≥ 992px | Input rộng 36%; Illustration và Output chia 50/50, xếp theo `secondarySplit`. Kéo thanh chia 5px để đổi kích thước. Kéo Input nhỏ hơn 250px thì panel thu thành thanh dọc (nút "Expand Input"), bấm để mở lại. Có `layoutId` thì kích thước được lưu vào localStorage; nếu trình duyệt chặn storage thì layout vẫn chạy, chỉ không nhớ kích thước |
| Tablet 768–991px | Như desktop, nhưng Illustration và Output luôn xếp dọc |
| Mobile < 768px | Mỗi lần một section, chuyển bằng tab. Tab có `keepMounted` vẫn giữ state và query khi bị ẩn |

**Vùng hiển thị (Illustration)**

```tsx
const imageRef = useRef<ImageViewerHandle>(null);

<VisualizationStage
  loading={isRendering}
  note="* Fasteners are not drawn to scale."
  controls={
    <ViewControls>
      <ResetViewButton onClick={() => imageRef.current?.reset()} />
      <ViewControlsGroup title="Object visibility">
        <Checkbox label="Side member" defaultChecked />
      </ViewControlsGroup>
    </ViewControls>
  }
>
  <ImageViewer ref={imageRef} src={drawingUrl} alt="Connection drawing" />
  {/* hoặc viewer 3D của app: web component, canvas Three.js… */}
</VisualizationStage>
```

| Component | Ghi chú |
| --- | --- |
| `Workspace` | Chiếm toàn bộ chiều cao dưới top nav |
| `SectionLayout` | Dùng `react-resizable-panels` |
| `Section` | Một tiêu đề (`title`) hoặc nhiều tab (`tabs`); `actions` ở bên phải thanh tab |
| `VisualizationStage` | Tablet/desktop: controls nổi góc phải, note góc trái. Mobile: controls và note nằm dưới viewer |
| `ViewControls`, `ViewControlsGroup`, `ResetViewButton` | |
| `ImageViewer` | Cuộn chuột hoặc pinch trên trackpad để zoom quanh con trỏ (trang không bị cuộn theo), pinch hai ngón trên màn hình cảm ứng, kéo để di chuyển, double-click để reset, nút +/−. `minScale` < 1 cho thu nhỏ hơn cỡ vừa khung. Đổi `src` thì reset view và hiện lại loading. Không cần thư viện ngoài |
| `DropOverlay` | |

Viewer 3D là code riêng của app. Đặt nó làm `children` của `VisualizationStage`.

## Design token

Mọi giá trị nằm trong `src/tokens/tokens.ts`, gồm cả các thang màu đầy đủ: `pumpkinOrange`, `trueGray`, `sstOrange`, `sageGreen`, `blue` (mỗi thang 0–100). Component chỉ dùng token theo **vai trò**.

- `defaultColors`: giá trị hex mặc định.
- `colors`: tham chiếu biến CSS (`colors.brand` = `var(--color-brand)`), đổi được theo [config](#đổi-màu-theo-app).
- `colorVar('brand')` trả về tên biến `--color-brand`.

| Vai trò | Token | Giá trị |
| --- | --- | --- |
| Màu chính (nút primary, radio/switch/tab đang chọn) | `colors.brand` | `#a8671d` |
| Hover / active của màu chính | `brandHover` / `brandActive` | `#d38225` / `#7a4b16` |
| Viền focus của input | `focusRing` | `#f0c18c` |
| Nền option khi hover / khi được chọn | `brandSubtle` / `brandSelected` | `#fcf3e9` / `#f7dec1` |
| Chữ / chữ phụ | `text` / `textMuted` | `#343434` / `#686868` |
| Nền app / nền trắng / nền xám nhạt | `surfaceApp` / `surface` / `surfaceSubtle` | `#f4f4f4` / `#fff` / `#fafafa` |
| Viền input / viền mặc định | `borderInput` / `border` | `#d9d9d9` / `#f0f0f0` |
| Lỗi / cảnh báo / thành công | `danger` / `warning` / `success` | `#b32c06` / `#db9f24` / `#789048` |
| Font | `typography.fontFamily.sans` | Inter (variable, 100–900), sau đó là font hệ thống |
| Density | `standard` / `expanded` | 14px/17.5px, 16px/24px |
| Bo góc | `radius.sm` / `md` / `lg` / `xl` | 0.125 / 0.25 / 0.5 / 1rem |
| Breakpoint | `sm` / `md` / `lg` / `xl` | 640 / 768 / 992 / 1280px |
| Top nav / input / tab | `layout` | cao 54 / 40 / 48px |
| Menu | `layout.menuMinWidth` / `menuMaxWidth` / `menuItemMinHeight` / `menuItemMinHeightTouch` | 160 / 320 / 36 / 48px |

**Trong Tailwind**, token có cùng tên dạng kebab-case: `bg-brand`, `text-danger`, `border-border-input`, `bg-pumpkin-orange-10`, `shadow-popover`, `rounded-sm`, `z-(--z-top-nav)`.

**Trong MUI**: `theme.palette.primary.main` = `brand` (giá trị hex đã tính theo config); các thang màu nằm ở `theme.palette.pumpkinOrange[50]`…; toàn bộ token có ở `theme.tokens`. `theme.spacing` dùng bước 4px như Tailwind (`sx={{ p: 2 }}` = 0.5rem).

## Sửa và mở rộng kit

**Đổi hoặc thêm token**
1. Sửa `src/tokens/tokens.ts`. Màu theo vai trò thêm vào `defaultColors`.
2. Chạy `pnpm tokens` để cập nhật `tokens.generated.css`.
3. Nếu token dùng trong MUI, tham chiếu nó trong `createPlatformTheme.ts`: dùng `colors.x` trong `styleOverrides`, và giá trị đã tính (`v.x`) trong `palette`.

Không sửa tay `tokens.generated.css`, và không viết mã hex trong component.

**Thêm component**
- Ưu tiên style qua theme (`components.MuiXxx.styleOverrides` hoặc `variants`), để MUI gốc cũng đúng giao diện. Chỉ viết wrapper khi cần API gọn hơn.
- Lấy màu, bóng, bo góc từ `tokens`; layout dùng class Tailwind; ghép class bằng `cn()`.
- Chỉ dùng MUI làm nền. Không thêm Radix, Bootstrap hay thư viện UI khác.
- Callback trả về giá trị đã chuẩn hóa (ví dụ `onChange(checked: boolean)`) thay vì event.
- Control nhận dữ liệu thì gọi `useFormField()` để lấy `id`, `describedBy`, `invalid`, `labelId`.
- Theo [Quy tắc hành vi](#quy-tắc-hành-vi); control có thể focus phải có style `.Mui-focusVisible` hoặc `:focus-visible`.
- Export trong `src/index.ts`, rồi thêm demo: một `<DemoSection id=…>` trong trang phù hợp ở `src/showcase/pages/`, và một mục tương ứng trong `src/showcase/catalog.ts` (ghi các export mà demo trình bày). Test `showcase.spec.ts` báo lỗi nếu có export nào chưa có demo.
- Phát hành cho các app: tăng `version` trong `package.json` (semver: thêm tính năng = minor, sửa lỗi = patch, thay đổi làm vỡ code = major) rồi `pnpm pack`. Không tăng version thì pnpm ở app sẽ dùng lại bản cũ trong cache dù file tarball đã khác.
- Thêm test vào `tests/e2e` (hoặc `tests/unit` nếu là logic thuần), rồi chạy `pnpm check && pnpm test:e2e`.

**Thêm variant cho Button**: khai báo tên trong `src/theme/augmentation.ts` (`ButtonPropsVariantOverrides`), rồi thêm style vào `MuiButton.variants` trong theme.

## Đưa vào Nx workspace

| Thư mục trong kit | Đích trong workspace | Tag Nx |
| --- | --- | --- |
| `src/tokens/`, `scripts/build-tokens.ts` | `libs/ui/tokens` | `type:ui` |
| `src/theme/`, `src/components/`, `src/utils/`, `src/index.ts` | `libs/ui/components` (package `@platform/ui`) | `type:ui` |
| `tests/` | `libs/ui/components/tests` | — |
| `public/images` | `libs/ui/assets`; app copy vào `public/` lúc build | — |
| `src/showcase/` | Không copy; chuyển thành story của Storybook | — |

- `package.json` của kit đã khai báo sẵn `exports` (`"."`, `"./theme.css"`, `"./tokens"`) và `peerDependencies`. Khi đưa vào Nx, giữ nguyên hai phần này.
- Trong app, chặn import trực tiếp `@mui/*` (ESLint `no-restricted-imports`) để mọi app đi qua `@platform/ui`.

## Quyết định thiết kế

Các lựa chọn dưới đây là có chủ ý. Khi thêm hoặc sửa component, giữ đúng các lựa chọn này.

- **Chỉ dùng MUI làm nền.** Dialog, Tooltip, Popover, Switch, Checkbox, Accordion đều dựng trên MUI, không trộn thêm Radix hay thư viện UI khác.
- **Disabled phải trông "tắt".** Nút `default`/`tertiary` khi disabled có nền xám nhạt; nút primary khi disabled mờ đi, không bao giờ đậm hơn trạng thái bình thường.
- **Focus dùng `:focus-visible`** thay vì `:focus`, để nút không giữ màu active sau khi click chuột. Ripple tắt; mọi control (kể cả checkbox, radio, switch, tab) có viền focus rõ ràng.
- **Alert cảnh báo** dùng chữ `warningText` (nâu) thay vì vàng, cho đủ tương phản.
- **Font Inter** (SIL OFL 1.1, mã nguồn mở), đóng gói kèm kit. Có đủ chữ tiếng Việt, Latin mở rộng, Cyrillic, Greek; không phát sinh license font. Xem [License](#license).
- **Thứ bậc chữ**: tiêu đề Accordion, Dialog, Card dùng bold, label dùng medium, để tách rõ tiêu đề với label của field.
- **Release notes** là component dùng chung: mỗi app chỉ cung cấp dữ liệu.
- **Toast** dừng khi rê chuột hoặc khi cửa sổ ở nền; toast lỗi không tự đóng (WCAG 2.2.1).
- **Tooltip dùng `describeChild`**, để tooltip không ghi đè tên của nút với trình đọc màn hình.
- **Icon** chỉ dùng `@mui/icons-material`.
- **Shadow thương hiệu là token riêng** (`shadows.popover`…); `theme.shadows[0]` giữ đúng quy ước MUI là `'none'`.
- **Class density gắn vào `<body>`**, không phải `<html>`, để đơn vị `rem` không đổi.
- **Bố cục**: dùng `react-resizable-panels` (đang được bảo trì); Input thu thành thanh dọc có thể mở lại; kích thước panel được lưu; bảng điều khiển viewer có nền trắng mờ và nằm dưới viewer trên mobile.
- **`theme.spacing` = 4px** (mặc định của MUI là 8px), để khoảng cách nhỏ đi theo nhịp 4px.

## Chưa có trong kit

- Drawer mobile, Help Center, EULA, maintenance mode, menu File/Template/Print đầy đủ: thuộc `libs/shell`.
- Style in ấn (`print.css`, bảng in dọc), carousel sản phẩm, viewer 3D.
- Chưa có vì các app hiện tại chưa cần (thêm khi có app cần): Pagination, Breadcrumb, Skeleton, Progress bar, Date picker, File input, Slider.
- Dark mode: token đã là biến CSS nên có thể thêm bằng cách truyền bộ `colors` tối. Chưa làm vì các app hiện tại chưa cần.
- Tương phản của màu mặc định: chữ xám `textMuted` trên nền xám và cam trên trắng chưa đạt 4.5:1 ở vài chỗ. Test axe đang tắt rule `color-contrast`; nếu cần đạt WCAG AA thì chỉnh bằng `colors`.
- ESLint của kit chỉ kiểm tra code của kit. Chặn import `@mui/*` và mã hex trong app nên cấu hình ở cấp workspace.

## Thay đổi ở 0.5.1

- Kit là platform độc lập: tài liệu, comment và dữ liệu mẫu không còn tham chiếu tới app cũ. Ví dụ dùng app mẫu "Demo Calculator".
- Bỏ `scripts/copy-assets.sh`: logo và ảnh mẫu đã nằm sẵn trong `public/images`.
- Showcase: preset màu mặc định đổi tên thành "Orange (default)".
- API không đổi.

## Thay đổi ở 0.5

- **Font đổi sang Inter** (mã nguồn mở, SIL OFL 1.1) thay cho Helvetica Neue LT Std (thương mại). Kit tự mang font theo, app không cần chép file font và không cần license font riêng. Hỗ trợ tiếng Việt, Latin mở rộng, Cyrillic, Greek.
- API không đổi. Giao diện thay đổi nhẹ: chữ rộng hơn khoảng 5–8%; nên xem lại các chỗ có chiều rộng cố định (nút, nhãn, cột bảng).
- Nút "?" của `InfoTip` dùng font chung của kit.

## Thay đổi ở 0.4

Chỉ thêm và sửa lỗi, không làm vỡ code của 0.3:

- `GridView labels` và `defaultGridViewLabels`: dịch mọi chữ của grid.
- `ImageViewer`: pinch hai ngón trên màn hình cảm ứng; cuộn chuột không còn cuộn trang; sửa lỗi `minScale` < 1 bị nhảy về 1; đổi `src` thì reset view và hiện loading; xử lý `pointercancel`.
- `SectionLayout`: không lỗi khi localStorage bị chặn (iframe sandbox, chế độ riêng tư chặt); nút mở lại panel có tên "Expand <nhãn>" thay vì "Expand panel" (WCAG 2.5.3).
- Toast dùng `react-toastify/unstyled`: CSS chỉ còn một bản trong `@layer components`, không bị nạp thêm một bản ngoài layer đè lên class Tailwind.
- `PlatformThemeProvider overrides` truyền inline không còn tạo lại theme mỗi lần render.
- `peerDependencies` dạng `^` (React ≥ 19.3, MUI ≥ 9.4, Emotion ≥ 11.14).
- Công cụ: ESLint, `pnpm check`, typecheck cho `tests/unit` và `scripts`, CI GitHub Actions, `engines` và `packageManager`.

## Thay đổi ở 0.3

Chỉ thêm, không làm vỡ code của 0.2:

- `GridView` (sort, filter theo cột, master search, preset, cố định/đổi vị trí/ẩn cột).
- `Tooltip` (hover, chữ ngắn) và `InfoTip` (click, giải thích dài); `HelpPopover` giờ là alias của `InfoTip`.
- `ReleaseNotesDialog`, `ReleaseNotes`, `useReleaseNotesSeen`.
- Theme config: `PlatformThemeProvider config`, `definePlatformTheme`, `parseThemeConfig`, các hàm export, `contrastRatio`.
- `Accordion headingLevel`, `useAccordionGroup(keys, defaultExpanded, initial)`, `DataTable aria-label`.
- Sửa lỗi: tiêu đề Dialog bị viết hoa, khoảng trắng thừa trên Accordion, `Checkbox indeterminate` khai báo ARIA mâu thuẫn, id trùng trong Accordion, nút zoom của ImageViewer, vùng cuộn DataTable không focus được.

## Thay đổi so với 0.1

Những điểm có thể làm vỡ code đang dùng 0.1:

- Tên package đổi từ `@platform/ui-kit` thành `@platform/ui`, khớp với import trong tài liệu. `react`, `@mui/*`, `@emotion/*` chuyển sang `peerDependencies`.
- `colors.*` giờ là `var(--color-*)`. Chỗ nào cần hex (ví dụ `alpha(colors.x, …)` hay thư viện chart) thì dùng `defaultColors` hoặc `resolveColors(config)`.
- `IconButton` bắt buộc `aria-label` (hoặc `aria-labelledby`).
- `Dialog onClose` nhận thêm tham số `reason`. Code cũ `onClose={() => …}` vẫn chạy.
- `notify.error` không tự đóng nữa. Thêm `notify.warning` và `notify.dismiss`.
- `FormField` bọc MUI `FormControl`: `error` làm label đỏ và gắn `aria-invalid` cho control; `required` đặt thuộc tính `required` cho input.
- CSS của react-toastify được import trong `theme.css`, không import trong JS nữa.

## License

Kit không chứa font thương mại. Font Inter (https://rsms.me/inter) dùng SIL Open Font License 1.1 và được đóng gói qua `@fontsource-variable/inter`: dùng, nhúng và phân phối trong sản phẩm thương mại đều được, chỉ không được bán riêng file font. Khi app build, Vite chép các file `.woff2` vào thư mục output; `base` của app (ví dụ `/calc/`) được áp dụng tự động.

Font chia theo `unicode-range` (Latin, Latin mở rộng, tiếng Việt, Cyrillic, Greek), nên trình duyệt chỉ tải phần mà trang dùng tới. Chữ Inter không có (Trung, Nhật, Hàn, Thái, Ả Rập…) được hiển thị bằng font hệ thống đứng sau trong `--font-sans`.

Đến 0.4, kit dùng Helvetica Neue LT Std (font thương mại) đặt trong `public/fonts`. Các file đó không còn được dùng và đã được xóa khỏi toàn bộ lịch sử git; nếu máy bạn còn thư mục `public/fonts` thì có thể xóa (nó vẫn nằm trong `.gitignore`). Font serif `'Clarendon'` trong token chỉ là tên font để trình duyệt tìm trên máy; kit không kèm file, nên không phát sinh license.
