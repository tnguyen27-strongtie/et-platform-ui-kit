# Platform UI Kit

Design token, MUI theme và component React có sẵn style của **FD** (Blueprint, nhánh `main-3.2`), viết lại trên MUI 9 + Tailwind 4 để dùng cho các app mới trên platform. App dùng kit sẽ có giao diện giống FD mà không phải tự làm lại style.

Trạng thái: `tsc` strict pass, `vite build` pass, không có lỗi console. Giao diện đã kiểm tra bằng ảnh chụp Playwright ở 1440, 900 và 390px. Ở chế độ standard, kích thước đo được khớp FD: label 12px, input 14px và cao 40px, button 16px, tab 14px, ô bảng 12px.

## Mục lục

1. [Yêu cầu](#yêu-cầu)
2. [Bắt đầu nhanh](#bắt-đầu-nhanh)
3. [Cấu trúc](#cấu-trúc)
4. [Dùng trong app](#dùng-trong-app)
5. [Component](#component)
6. [Bố cục 3 section](#bố-cục-3-section)
7. [Design token](#design-token)
8. [Sửa và mở rộng kit](#sửa-và-mở-rộng-kit)
9. [Đưa vào Nx workspace](#đưa-vào-nx-workspace)
10. [Khác biệt so với FD](#khác-biệt-so-với-fd)
11. [Chưa có trong kit](#chưa-có-trong-kit)

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
node scripts/build-tokens.ts           # sinh src/theme/tokens.generated.css từ tokens.ts
scripts/copy-assets.sh ../et-blueprint # chép font Helvetica Neue + logo từ repo Blueprint vào public/
pnpm dev                                # http://localhost:5173
```

Showcase có 3 trang, chuyển bằng menu **View** trên thanh nav:

| Trang | URL | Nội dung |
| --- | --- | --- |
| Components | `/` | Mọi component ở mọi trạng thái (default, hover, disabled, error), bảng màu, công tắc đổi density |
| Workspace (stacked) | `/#workspace` | Bố cục FD: Input bên trái, Illustration trên Output bên phải |
| Workspace (side by side) | `/#workspace-columns` | Illustration và Output nằm cạnh nhau |

Các lệnh khác:

```bash
pnpm typecheck   # tsc strict
pnpm build       # typecheck + build showcase ra dist/
```

## Cấu trúc

```
src/
├── tokens/tokens.ts               # NGUỒN DUY NHẤT: màu, font, radius, shadow, z-index, breakpoint, layout
├── theme/
│   ├── createPlatformTheme.ts     # MUI theme, style FD cho 34 component MUI
│   ├── augmentation.d.ts          # type cho palette mở rộng và variant của Button
│   ├── PlatformThemeProvider.tsx  # CSS layer + ThemeProvider + CssBaseline + density
│   ├── theme.css                  # Tailwind 4: thứ tự layer, animation, utility, variant
│   ├── tokens.generated.css       # sinh từ tokens.ts, KHÔNG sửa tay
│   └── fonts.css                  # @font-face Helvetica Neue LT Std
├── components/                    # 16 component cơ bản
│   └── workspace/                 # bố cục 3 section: SectionLayout, Section, VisualizationStage, ImageViewer
├── utils/cn.ts                    # cn() = twMerge(clsx(...))
├── index.ts                       # entry: export mọi thứ ở trên
└── showcase/                      # trang demo, KHÔNG copy sang dự án
scripts/
├── build-tokens.ts                # tokens.ts → tokens.generated.css
└── copy-assets.sh                 # font + logo từ repo Blueprint
public/
├── fonts/                         # font có license, nằm trong .gitignore
└── images/                        # logo SST, bản vẽ mẫu cho showcase
```

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

`PlatformThemeProvider` làm 3 việc:
- Bật CSS layer để utility của Tailwind thắng style của MUI mà không cần `!important`.
- Nạp MUI theme cùng `CssBaseline`.
- Gắn class `density-standard` hoặc `density-expanded` lên `<body>`.

**2. Cấu hình Vite và Tailwind**

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react(), tailwindcss()] });
```

Tailwind 4 chỉ tự quét thư mục của app. Nếu kit nằm ngoài app (ví dụ `libs/ui`), thêm dòng sau vào `theme.css` của app:

```css
@source "../../libs/ui/components/src";
```

**3. Dùng component và token**

```tsx
import { Button, FormField, TextInput, colors } from '@platform/ui';

<FormField label="Design load" htmlFor="load" help="Factored load applied to the connection.">
  <TextInput id="load" addonAfter="lbs" />
</FormField>
<Button variant="primary">Calculate</Button>
<div className="flex gap-2 bg-surface-app p-2">…</div>   // class Tailwind từ token
<Box sx={{ color: colors.danger }}>…</Box>               // token trong TS
```

## Component

Style của hầu hết component nằm trong theme (`createPlatformTheme.ts`), nên cả component MUI gốc như `TextField`, `Select`, `Autocomplete`, `Menu` cũng có giao diện FD. Wrapper trong kit chỉ thêm API tiện dùng.

### Nút và hộp thoại

| Component | Tương ứng FD | Ghi chú |
| --- | --- | --- |
| `Button` | `Button` | Variant: `primary`, `primaryDark`, `secondary`, `default` (mặc định), `tertiary`, `text`, `textDark`, `fab`. Size: `small`, `medium` |
| `IconButton`, `CloseButton` | `Button variant="icon"`, nút đóng của Modal | |
| `Dialog`, `DialogHeader`, `DialogBody`, `DialogFooter` | `Modal` (Radix), `Dialog` (MUI) | `placement="top"` (mặc định, trượt xuống dưới top nav) hoặc `"center"` |
| `Tooltip` | `Tooltip` (Radix) | MUI Tooltip, có mũi tên, mặc định ở trên |
| `HelpPopover` | `Popper` (nút "?" màu cam) | Bấm để mở, có nút đóng |
| `notify.success/error/info`, `ToastHost` | `toastSuccess`, `toastError` | react-toastify, cấu hình như FD |

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
| `FormField` | `FormGroup` + `FormLabel` + `ErrorMessage` | Label 12px, `required` = label đỏ có `*`, `help` = nút "?", `error` = chữ đỏ 12px |
| `TextInput` | `InputGroup`, `FormControl` | Cao 40px, `addonBefore`/`addonAfter` cho đơn vị |
| `Select` | `Dropdown` | Chọn một hoặc nhiều (`multiple`), option có `image`, `note`, `disabled` |
| `Combobox` | `Dropdown` có tìm kiếm | MUI Autocomplete |
| `Checkbox`, `Switch` | `Checkbox`, `Switch` (Radix) | `onChange(checked: boolean)` |
| `RadioGroup` | `RadioGroup` + `Radio` | Giữ nguyên kiểu giá trị (number, boolean), `direction="row" \| "column"` |
| `OptionCardGroup` | `ButtonGroup` | Thẻ chọn có ảnh, dấu check cam ở thẻ đang chọn |

```tsx
<Select
  value={connection}
  onChange={setConnection}
  options={[
    { value: 'wood', label: 'Wood to Wood', note: 'most common' },
    { value: 'steel', label: 'Wood to Steel', image: '/img/steel.png' },
  ]}
/>
```

### Hiển thị và điều hướng

| Component | Tương ứng FD | Ghi chú |
| --- | --- | --- |
| `Tabs`, `Tab`, `TabPanel` | `Tabs.List/Trigger/Content` | Thanh tab xám, tab đang chọn màu cam |
| `Accordion` | `Accordion` (Radix) | Header xám nhạt, mũi tên cam xoay 90° khi mở |
| `Alert` | `Alert.Error/Warning/Success/Info` | `severity`, `title`, nội dung 12px |
| `DataTable` + `.Head/.Body/.Footer/.Row/.Cell` | `Table.*` | Ô 12px, header đậm cao 48px; kết hợp `@tanstack/react-table` để sort, filter |
| `LoadingIndicator` | `LoadingIndicator` | Vòng cam nhấp nháy "Updating Results" |
| `TopNav`, `NavMenu` | `.nav-item`, `.nav-dropdown-item` | Thanh cao 54px, gạch chân cam 4px khi hover/mở |

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

Mọi giá trị nằm trong `src/tokens/tokens.ts`, gồm cả thang màu đầy đủ của FD: `pumpkinOrange`, `trueGray`, `sstOrange`, `sageGreen`, `blue` (mỗi thang 0–100). Component chỉ dùng token theo **vai trò**:

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

**Trong Tailwind**, token có cùng tên dạng kebab-case: `bg-brand`, `text-danger`, `border-border-input`, `bg-pumpkin-orange-10`, `shadow-popover`, `rounded-sm`, `z-(--z-top-nav)`.

**Trong MUI**: `theme.palette.primary.main` = `brand`; các thang màu nằm ở `theme.palette.pumpkinOrange[50]`…; toàn bộ token có ở `theme.tokens`. `theme.spacing` dùng bước 4px như Tailwind (`sx={{ p: 2 }}` = 0.5rem).

## Sửa và mở rộng kit

**Đổi hoặc thêm token**
1. Sửa `src/tokens/tokens.ts`.
2. Chạy `node scripts/build-tokens.ts` để cập nhật `tokens.generated.css`.
3. Nếu token dùng trong MUI, tham chiếu nó trong `createPlatformTheme.ts`.

Không sửa tay `tokens.generated.css`, và không viết mã hex trong component.

**Thêm component**
- Ưu tiên style qua theme (`components.MuiXxx.styleOverrides` hoặc `variants`), để MUI gốc cũng đúng giao diện. Chỉ viết wrapper khi cần API gọn hơn.
- Lấy màu, bóng, bo góc từ `tokens`; layout dùng class Tailwind; ghép class bằng `cn()`.
- Chỉ dùng MUI làm nền. Không thêm Radix, Bootstrap hay thư viện UI khác.
- Callback trả về giá trị đã chuẩn hóa (ví dụ `onChange(checked: boolean)`) thay vì event.
- Export trong `src/index.ts` và thêm ví dụ vào `src/showcase`.
- Chạy `pnpm build` rồi xem showcase ở cả desktop và mobile.

**Thêm variant cho Button**: khai báo tên trong `augmentation.d.ts` (`ButtonPropsVariantOverrides`), rồi thêm style vào `MuiButton.variants` trong theme.

## Đưa vào Nx workspace

| Thư mục trong kit | Đích trong workspace | Tag Nx |
| --- | --- | --- |
| `src/tokens/`, `scripts/build-tokens.ts` | `libs/ui/tokens` | `type:ui` |
| `src/theme/`, `src/components/`, `src/utils/`, `src/index.ts` | `libs/ui/components` (package `@platform/ui`) | `type:ui` |
| `public/fonts`, `public/images` | `libs/ui/assets`; app copy vào `public/` lúc build | — |
| `src/showcase/` | Không copy; chuyển thành story của Storybook | — |

- Để `import '@platform/ui/theme.css'` hoạt động, khai báo `exports` trong `package.json` của lib, gồm `"."` và `"./theme.css"`.
- Đặt `react`, `@mui/*`, `@emotion/*` làm `peerDependencies` của lib để cả workspace dùng chung một bản.
- Trong app, chặn import trực tiếp `@mui/*` (ESLint `no-restricted-imports`) để mọi app đi qua `@platform/ui`.

## Khác biệt so với FD

Các điểm dưới đây khác FD có chủ ý: để sửa lỗi của FD hoặc để dùng thư viện đang được bảo trì.

- **Chỉ dùng MUI.** Các component FD dựng trên Radix (Modal, Tooltip, Popover, Switch, Checkbox, Accordion) được viết lại bằng MUI, giữ kích thước, màu và animation.
- **Nút `default`/`tertiary` khi disabled** có nền xám nhạt. FD dùng nền nâu đậm với chữ đen nên gần như không đọc được.
- **Focus dùng `:focus-visible`** thay vì `:focus`, để nút không giữ màu active sau khi click chuột.
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

## License

Helvetica Neue LT Std là font thương mại. `public/fonts` nằm trong `.gitignore` và được chép bằng `scripts/copy-assets.sh`. Cần xác nhận license cho sản phẩm mới trước khi phát hành.
