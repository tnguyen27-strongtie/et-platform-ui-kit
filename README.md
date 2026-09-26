# Platform UI Kit

Design token, MUI theme và component React có sẵn style của **FD** (Blueprint, nhánh `main-3.2`), viết lại trên MUI 9 + Tailwind 4 để dùng cho các app mới trên platform. App dùng kit sẽ có giao diện giống FD mà không phải tự làm lại style.

Trạng thái: `tsc` strict pass, library build pass, 15 unit test (logic số) và 18 test Playwright (hành vi, bàn phím, a11y bằng axe, đổi theme) pass, không có lỗi console. Ở chế độ standard, kích thước đo được khớp FD: label 12px, input 14px và cao 40px, button 16px, tab 14px, ô bảng 12px.

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
13. [Khác biệt so với FD](#khác-biệt-so-với-fd)
14. [Chưa có trong kit](#chưa-có-trong-kit)
15. [Thay đổi so với 0.1](#thay-đổi-so-với-01)

## Yêu cầu

| Công cụ / thư viện | Phiên bản |
| --- | --- |
| Node.js | 24 LTS (script `build-tokens.ts` chạy TypeScript trực tiếp, cần Node ≥ 22.18) |
| pnpm | 12 |
| React | 19.3 |
| `@mui/material`, `@mui/icons-material` | 9.4 |
| `@emotion/react`, `@emotion/styled` | 11.14 |
| Tailwind CSS, `@tailwindcss/vite` | 4.3 |
| `react-resizable-panels` | 4.x (bố cục 3 section) |
| `react-toastify` | 11 |
| `clsx`, `tailwind-merge` | 2.1, 3.7 |
| TypeScript / Vite | 6.0 / 8.3 |

## Bắt đầu nhanh

```bash
pnpm install
pnpm tokens                             # sinh src/theme/tokens.generated.css từ tokens.ts
scripts/copy-assets.sh ../et-blueprint  # chép font Helvetica Neue + logo từ repo Blueprint vào public/
pnpm dev                                # showcase: http://localhost:5173
```

Showcase có 3 trang, chuyển bằng menu **View** trên thanh nav:

| Trang | URL | Nội dung |
| --- | --- | --- |
| Components | `/` | Mọi component ở mọi trạng thái (default, hover, disabled, error), bảng màu, công tắc đổi density |
| Workspace (stacked) | `/#workspace` | Bố cục FD: Input bên trái, Illustration trên Output bên phải |
| Workspace (side by side) | `/#workspace-columns` | Illustration và Output nằm cạnh nhau |

Góc phải thanh nav của showcase có ô chọn màu brand để thử cấu hình theme.

Các lệnh khác:

```bash
pnpm typecheck        # tsc strict
pnpm test             # unit test logic số (node --test, không cần thư viện)
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
│   ├── createPlatformTheme.ts     # MUI theme, style FD cho các component MUI
│   ├── colors.ts                  # resolveColors(): màu app + màu phái sinh từ brand
│   ├── augmentation.ts            # type cho palette mở rộng và variant của Button
│   ├── PlatformThemeProvider.tsx  # CSS layer + ThemeProvider + CssBaseline + density + màu
│   ├── theme.css                  # Tailwind 4: thứ tự layer, animation, utility, variant
│   ├── tokens.generated.css       # sinh từ tokens.ts, KHÔNG sửa tay
│   └── fonts.css                  # @font-face Helvetica Neue LT Std
├── components/                    # component cơ bản
│   └── workspace/                 # bố cục 3 section: SectionLayout, Section, VisualizationStage, ImageViewer
├── utils/cn.ts                    # cn() = twMerge(clsx(...))
├── utils/number.ts                # parse/format/step số, dùng cho NumberInput và validate của app
├── index.ts                       # entry: export mọi thứ ở trên
└── showcase/                      # trang demo, KHÔNG copy sang dự án
scripts/
├── build-tokens.ts                # tokens.ts → tokens.generated.css
└── copy-assets.sh                 # font + logo từ repo Blueprint
tests/
├── unit/                          # node --test
└── e2e/
    ├── harness/                   # trang test: mỗi component một fixture (#select, #dialog…)
    ├── components/                # spec theo nhóm: forms, buttons, navigation, overlays, display, smoke
    ├── showcase.spec.ts           # trang showcase: đổi theme, NumberInput, dialog xác nhận
    └── helpers.ts
vite.lib.config.ts, tsconfig.lib.json  # library build
public/
├── fonts/                         # font có license, nằm trong .gitignore
└── images/                        # logo SST, bản vẽ mẫu cho showcase
```

## Cài vào app

Package tên `@platform/ui`. Để `private: true` nên không bao giờ bị publish nhầm lên npm công khai. Chọn một trong ba cách:

| Cách | Lệnh trong app | Khi nào |
| --- | --- | --- |
| Tarball | `pnpm pack` trong kit, rồi `pnpm add ./path/platform-ui-0.2.0.tgz` | App ở repo khác, muốn khóa phiên bản |
| Link thư mục | `pnpm add link:../et-platform-ui-kit` (chạy `pnpm build` trong kit trước) | Sửa kit và app cùng lúc |
| Registry nội bộ | Bỏ `private`, thêm `publishConfig.registry`, rồi `pnpm publish` | Nhiều team dùng chung |

App tự cài các peer dependency: `react`, `react-dom` 19.3, `@mui/material`, `@mui/icons-material` 9.4, `@emotion/react`, `@emotion/styled` 11.14, `tailwindcss` 4. Kit không tự mang theo các package này, nên cả app chỉ có một bản React, MUI và Emotion.

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

Style của hầu hết component nằm trong theme (`createPlatformTheme.ts`), nên cả component MUI gốc như `TextField`, `Select`, `Autocomplete`, `Menu` cũng có giao diện FD. Wrapper trong kit chỉ thêm API tiện dùng.

### Nút và hộp thoại

| Component | Tương ứng FD | Ghi chú |
| --- | --- | --- |
| `Button` | `Button` | Variant: `primary`, `primaryDark`, `secondary`, `default` (mặc định), `tertiary`, `text`, `textDark`, `danger`, `fab`. Size: `small`, `medium`. `loading` hiện spinner và chặn click |
| `IconButton`, `CloseButton` | `Button variant="icon"`, nút đóng của Modal | `IconButton` bắt buộc `aria-label` (kiểm tra ở mức type) |
| `DropdownMenu` | — | Nút mở danh sách hành động; item có `icon`, `danger`, `divider` |
| `Dialog`, `DialogHeader`, `DialogBody`, `DialogFooter` | `Modal` (Radix), `Dialog` (MUI) | `placement="top"` (mặc định) hoặc `"center"`. `dismissible`: `any` / `escape` / `none`. `onClose(reason)` |
| `ConfirmDialog` | — | Xác nhận trước khi xóa/reset. `destructive` = nút đỏ và focus sẵn ở Cancel. `loading` = khóa dialog |
| `Tooltip` | `Tooltip` (Radix) | MUI Tooltip, có mũi tên, mặc định ở trên |
| `HelpPopover` | `Popper` (nút "?" màu cam) | Bấm để mở, có nút đóng |
| `notify.success/info/warning/error/dismiss`, `ToastHost` | `toastSuccess`, `toastError` | react-toastify. Lỗi ở lại tới khi đóng tay, cảnh báo 8s, còn lại 5s; dừng khi rê chuột |

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

| Component | Tương ứng FD | Ghi chú |
| --- | --- | --- |
| `FormField` | `FormGroup` + `FormLabel` + `ErrorMessage` | Label 12px, `required` = label đỏ có `*`, `help` = nút "?", `description` = gợi ý xám, `error` = chữ đỏ 12px, `disabled`. Tự nối label/mô tả/lỗi vào control bên trong |
| `TextInput` | `InputGroup`, `FormControl` | Cao 40px, `addonBefore`/`addonAfter` cho đơn vị. `multiline minRows={3}` cho textarea |
| `NumberInput` | `InputGroup` kiểu số | `value: number \| null`, `min`, `max`, `step`, `precision`, `clampBehavior`. Xem [NumberInput](#numberinput) |
| `Select` | `Dropdown` | Chọn một hoặc nhiều (`multiple`), option có `image`, `note`, `disabled` |
| `Combobox` | `Dropdown` có tìm kiếm | MUI Autocomplete. Option có label không phải chuỗi thì thêm `searchText` |
| `Checkbox`, `Switch` | `Checkbox`, `Switch` (Radix) | `onChange(checked: boolean)` |
| `RadioGroup` | `RadioGroup` + `Radio` | Giữ nguyên kiểu giá trị (number, boolean), `direction="row" \| "column"` |
| `OptionCardGroup` | `ButtonGroup` | Thẻ chọn có ảnh, dấu check cam ở thẻ đang chọn |

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

| Component | Tương ứng FD | Ghi chú |
| --- | --- | --- |
| `Tabs`, `Tab`, `TabPanel` | `Tabs.List/Trigger/Content` | Thanh tab xám, tab đang chọn màu cam. Truyền `id` cho `Tabs` và `tabsId` cho `TabPanel` để nối tab với panel |
| `Accordion` | `Accordion` (Radix) | Header xám nhạt, mũi tên cam xoay 90° khi mở. `headingLevel` (mặc định `h3`) |
| `useAccordionGroup`, `ExpandCollapseAllButton` | nút "Collapse all" của Input | Giữ trạng thái chung cho nhiều Accordion: `<Accordion {...group.item('loads')} />`, nút đặt ở `Section actions` |
| `Alert` | `Alert.Error/Warning/Success/Info` | `severity`, `title`, nội dung 12px |
| `DataTable` + `.Head/.Body/.Footer/.Row/.Cell` | `Table.*` | Ô 12px, header đậm cao 48px; kết hợp `@tanstack/react-table` để sort, filter |
| `LoadingIndicator` | `LoadingIndicator` | Vòng cam nhấp nháy "Updating Results", phủ cả khung |
| `Spinner` | — | Vòng xoay nhỏ inline, theo màu chữ |
| `Card` | — | Header nền xám, tiêu đề bold (`title`, `subtitle`, `actions`), `footer`. `padding`: `sm` (8px, mặc định), `md` (12px), `none` (đặt bảng sát viền, tự bỏ viền đôi) |
| `EmptyState` | — | Khung trống: "No results yet" + nút hành động |
| `ErrorBoundary` | — | Lỗi render trong một khung không làm trắng cả app. `resetKeys`, `fallback`, `onError` |
| `Box`, `Stack`, `Typography`, `Divider`, `Link`, `Chip` | — | Re-export từ MUI, đã có style theo theme |
| `TopNav`, `NavMenu` | `.nav-item`, `.nav-dropdown-item` | Thanh cao 54px, gạch chân cam 4px khi hover/mở |

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
| Thứ bậc chữ nhất quán | Tiêu đề (Card, Dialog, Accordion, EmptyState, Alert, đầu bảng, `Typography h1–h6`) = **bold**; label = medium; nội dung = regular. `h1`–`h6` theo thang gọn cho app công cụ (24 → 12px), không dùng thang mặc định 96px của MUI |
| Khoảng cách theo nhịp 8px | Padding của Card, Dialog, Accordion, ô bảng đều 0.5rem; khoảng cách giữa các field 0.5–0.75rem |
| Kích thước menu thống nhất | Menu hành động (DropdownMenu, NavMenu, MUI `Menu`) rộng 160–320px (`layout.menuMinWidth/MaxWidth`); nhãn dài xuống dòng, không bị cắt. Item cao tối thiểu 36px, 48px trên màn hình cảm ứng. Dropdown của Select rộng bằng ô Select |
| Chữ và icon thẳng hàng | `fonts.css` ghi đè vertical metrics của Helvetica Neue LT Std, nên chữ nằm đúng giữa hộp dòng; mọi cặp icon + chữ căn `center` là thẳng hàng |

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
| HelpPopover, Tooltip | Mở/đóng, Escape trả focus; tooltip là mô tả (không đổi tên nút), hiện khi hover và focus bàn phím |
| Toast | Mỗi loại được đọc; success tự đóng, error ở lại; hover dừng timer; nút đóng, dismiss all; tối đa 5 toast |
| Alert, Card, DataTable, EmptyState, Spinner, LoadingIndicator | Role đúng (`alert`/`status`/`progressbar`); heading của Card; bảng có header, vùng cuộn focus được bằng bàn phím, header dính |
| ErrorBoundary | Lỗi bị chặn trong khung, báo qua `onError`, thử lại vẫn lỗi nếu dữ liệu chưa sửa, `resetKeys` khôi phục |
| ImageViewer | Nút zoom trong giới hạn; nút zoom vẫn chạy khi đang zoom; bấm nhanh không reset; cuộn chuột, double-click và `ref.reset()` |
| SectionLayout | 3 khung có thanh kéo; kéo Input nhỏ quá thì thu thành thanh dọc và mở lại được; mobile: mỗi lần một khung, Input giữ dữ liệu |
| Density | Đổi class trên `<body>` và cỡ chữ 14 ↔ 16px |

Thêm component mới thì thêm fixture, thêm tên vào `fixtureNames` trong `tests/e2e/helpers.ts`, và viết spec cho các hành vi của nó.

## Bố cục 3 section

Bố cục chuẩn của calculator FD: **Input** bên trái, **Illustration** (3D, 2D, ảnh) và **Output** bên phải.

```tsx
<Workspace>
  <SectionLayout
    layoutId="fd"               // lưu kích thước panel vào localStorage; bỏ để không lưu
    secondarySplit="rows"       // setting "orientation" của FD: rows = xếp dọc, columns = cạnh nhau
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
| Desktop ≥ 992px | Input rộng 36%; Illustration và Output chia 50/50, xếp theo `secondarySplit`. Kéo thanh chia 5px để đổi kích thước. Kéo Input nhỏ hơn 250px thì panel thu thành thanh dọc, bấm để mở lại |
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
  {/* hoặc viewer 3D của app: <bp-fd …/>, canvas Three.js… */}
</VisualizationStage>
```

| Component | Tương ứng FD | Ghi chú |
| --- | --- | --- |
| `Workspace` | `.workspace` | Chiếm toàn bộ chiều cao dưới top nav |
| `SectionLayout` | `PageView` + `DesktopView`/`TabletView`/`MobileView` + `react-split-pane` | Dùng `react-resizable-panels` |
| `Section` | `Tabs` dùng làm khung panel | Một tiêu đề (`title`) hoặc nhiều tab (`tabs`); `actions` ở bên phải thanh tab |
| `VisualizationStage` | khung `IllustrationContent` | Tablet/desktop: controls nổi góc phải, note góc trái. Mobile: controls và note nằm dưới viewer |
| `ViewControls`, `ViewControlsGroup`, `ResetViewButton` | cột điều khiển 3D, `ResetViewButton` | |
| `ImageViewer` | `IllustrationImage` + `@panzoom/panzoom` | Cuộn chuột để zoom quanh con trỏ, kéo để di chuyển, double-click để reset, nút +/−. Không cần thư viện ngoài |
| `DropOverlay` | lớp phủ khi kéo file JSON vào Input | |

Viewer 3D là code riêng của app. Đặt nó làm `children` của `VisualizationStage`.

## Design token

Mọi giá trị nằm trong `src/tokens/tokens.ts`, gồm cả thang màu đầy đủ của FD: `pumpkinOrange`, `trueGray`, `sstOrange`, `sageGreen`, `blue` (mỗi thang 0–100). Component chỉ dùng token theo **vai trò**.

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
| Font | `typography.fontFamily.sans` | Helvetica Neue LT Std |
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
- Export trong `src/index.ts` và thêm ví dụ vào `src/showcase`.
- Thêm test vào `tests/e2e` (hoặc `tests/unit` nếu là logic thuần), rồi chạy `pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`.

**Thêm variant cho Button**: khai báo tên trong `augmentation.d.ts` (`ButtonPropsVariantOverrides`), rồi thêm style vào `MuiButton.variants` trong theme.

## Đưa vào Nx workspace

| Thư mục trong kit | Đích trong workspace | Tag Nx |
| --- | --- | --- |
| `src/tokens/`, `scripts/build-tokens.ts` | `libs/ui/tokens` | `type:ui` |
| `src/theme/`, `src/components/`, `src/utils/`, `src/index.ts` | `libs/ui/components` (package `@platform/ui`) | `type:ui` |
| `tests/` | `libs/ui/components/tests` | — |
| `public/fonts`, `public/images` | `libs/ui/assets`; app copy vào `public/` lúc build | — |
| `src/showcase/` | Không copy; chuyển thành story của Storybook | — |

- `package.json` của kit đã khai báo sẵn `exports` (`"."`, `"./theme.css"`, `"./tokens"`) và `peerDependencies`. Khi đưa vào Nx, giữ nguyên hai phần này.
- Trong app, chặn import trực tiếp `@mui/*` (ESLint `no-restricted-imports`) để mọi app đi qua `@platform/ui`.

## Khác biệt so với FD

Các điểm dưới đây khác FD có chủ ý: để sửa lỗi của FD hoặc để dùng thư viện đang được bảo trì.

- **Chỉ dùng MUI.** Các component FD dựng trên Radix (Modal, Tooltip, Popover, Switch, Checkbox, Accordion) được viết lại bằng MUI, giữ kích thước, màu và animation.
- **Nút `default`/`tertiary` khi disabled** có nền xám nhạt. FD dùng nền nâu đậm với chữ đen nên gần như không đọc được.
- **Focus dùng `:focus-visible`** thay vì `:focus`, để nút không giữ màu active sau khi click chuột. Mọi control có viền focus rõ ràng; FD dựa vào ripple nên checkbox/radio/switch/tab không hiện focus.
- **Nút primary khi disabled** mờ đi thay vì chuyển sang nâu đậm (FD làm nút disabled trông nổi hơn nút đang bật).
- **Alert cảnh báo** dùng chữ `warningText` (nâu) thay vì vàng, cho đủ tương phản.
- **Căn chữ**: file font LT Std có ascent bằng đúng chiều cao chữ hoa, nên chữ bị đẩy lên khoảng 2px so với checkbox, radio, switch và icon trong nút. `fonts.css` dùng `ascent-override: 90.5%; descent-override: 21.2%; line-gap-override: 0%` (tỉ lệ của Helvetica/Arial) để sửa tận gốc.
- **Tiêu đề in đậm**: tiêu đề Accordion và Dialog dùng bold (FD dùng medium), để tách rõ với label của field.
- **Toast** dừng khi rê chuột; toast lỗi không tự đóng. FD tự đóng sau 5s kể cả khi đang đọc.
- **Tooltip dùng `describeChild`**, để tooltip không ghi đè tên của nút với trình đọc màn hình.
- **Icon**: `Blue-Icon-Font` và `material-icons` được thay bằng `@mui/icons-material`, nên hình checkbox và dấu check trên thẻ chọn hơi khác FD.
- **Shadow thương hiệu là token riêng.** FD đặt shadow popover ở `shadows[0]`, trái quy ước MUI (phần tử 0 phải là `'none'`).
- **Class density gắn vào `<body>`**, không phải `<html>`, để đơn vị `rem` không đổi.
- **Bố cục**:
  - `react-split-pane` (không còn bảo trì) được thay bằng `react-resizable-panels`.
  - Input thu thành thanh dọc có thể mở lại, thay vì chỉ ẩn nội dung.
  - Kích thước panel được lưu lại.
  - Bảng điều khiển viewer có nền trắng mờ, và nằm dưới viewer trên mobile.
- **`theme.spacing` = 4px** (FD dùng mặc định 8px của MUI).

## Chưa có trong kit

- Drawer mobile, Help Center, EULA, maintenance mode, menu File/Template/Print đầy đủ: thuộc `libs/shell`.
- Style in ấn (`print.css`, bảng in dọc), carousel sản phẩm, viewer 3D.
- Glyph gốc của `Blue-Icon-Font`: nếu cần, chép font từ `libs/shared/src/assets/fonts` của Blueprint và khai báo thêm trong `fonts.css`.
- Chưa có vì các app hiện tại chưa cần (thêm khi có app cần): Pagination, Breadcrumb, Skeleton, Progress bar, Date picker, File input, Slider.
- Dark mode: token đã là biến CSS nên có thể thêm bằng cách truyền bộ `colors` tối. Chưa làm vì FD không có.
- Tương phản màu FD: chữ xám `textMuted` trên nền xám và cam trên trắng chưa đạt 4.5:1 ở vài chỗ. Test axe đang tắt rule `color-contrast`; nếu cần đạt WCAG AA thì chỉnh bằng `colors`.
- ESLint (chặn import `@mui/*` và hex trong app) nên cấu hình ở cấp workspace.

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

Helvetica Neue LT Std là font thương mại. `public/fonts` nằm trong `.gitignore` và được chép bằng `scripts/copy-assets.sh`. Package không chứa file font, chỉ chứa `fonts.css` trỏ tới `/fonts/…` trong `public/` của app. Cần xác nhận license cho sản phẩm mới trước khi phát hành.

Lưu ý: bản 0.1 đã commit file font vào git. Commit gỡ font chỉ bỏ chúng khỏi các commit sau; font vẫn còn trong lịch sử. Nếu repo được chia sẻ ra ngoài, cần viết lại lịch sử (ví dụ `git filter-repo --path public/fonts --path dist --invert-paths`).
