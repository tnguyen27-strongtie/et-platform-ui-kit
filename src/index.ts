// MUI type augmentation (Button variants, palette scales, theme.tokens)
import './theme/augmentation';

// Tokens
export * from './tokens/tokens';

// Theme
export {
  APPEARANCE_NAMES,
  APPEARANCES,
  type AppearanceName,
  classicAppearance,
  defineAppearance,
  glassAppearance,
  isAppearanceName,
  type PlatformAppearance,
  type PlatformAppearanceDark,
  resolveAppearance,
} from './theme/appearance';
export {
  appearanceCssVars,
  colorCssVars,
  resolveColors,
  resolveSchemeColors,
  type SchemeColorOptions,
} from './theme/colors';
export { adaptBrandForDark, contrast, mix, readableOn } from './theme/colorMath';
export { createPlatformTheme, type PlatformTheme, type PlatformThemeOptions } from './theme/createPlatformTheme';
export { PlatformThemeProvider, type PlatformThemeProviderProps, usePlatformColorScheme } from './theme/PlatformThemeProvider';
export {
  COLOR_ROLES,
  contrastRatio,
  definePlatformTheme,
  isValidColor,
  normalizeThemeConfig,
  parseRgb,
  parseThemeConfig,
  THEME_CONFIG_VERSION,
  themeConfigToJson,
  themeConfigToTs,
  type ParseThemeResult,
  type PlatformThemeConfig,
} from './theme/themeConfig';

// Utils
export { cn } from './utils/cn';
export {
  clamp,
  decimalsOf,
  formatDisplayNumber,
  type FormatDisplayNumberOptions,
  formatFraction,
  type FormatFractionOptions,
  formatNumber,
  isInRange,
  isPartialNumber,
  type NumberRules,
  parseNumber,
  roundTo,
  stepNumber,
} from './utils/number';

// Components
export {
  Accordion,
  ExpandCollapseAllButton,
  useAccordionGroup,
  type AccordionGroup,
  type AccordionGroupOptions,
  type AccordionProps,
  type ExpandCollapseAllButtonProps,
} from './components/Accordion';
export {
  AgreementDialog,
  useAgreementAccepted,
  type AgreementDialogLabels,
  type AgreementDialogProps,
  type UseAgreementAcceptedOptions,
} from './components/AgreementDialog';
export { Alert, type AlertProps, type AlertSeverity } from './components/Alert';
export { Button, CloseButton, IconButton, type ButtonProps, type IconButtonProps } from './components/Button';
export { Card, type CardProps } from './components/Card';
export {
  Checkbox,
  RadioGroup,
  Switch,
  type CheckboxProps,
  type RadioGroupProps,
  type RadioOption,
  type SwitchProps,
} from './components/Choice';
export { Combobox, type ComboboxProps } from './components/Combobox';
export { ConfirmDialog, type ConfirmDialogProps } from './components/ConfirmDialog';
export { DataTable, type DataTableProps } from './components/DataTable';
export {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  type DialogCloseReason,
  type DialogProps,
} from './components/Dialog';
export { DescriptionList, type DescriptionListItem, type DescriptionListProps } from './components/DescriptionList';
export { DropdownMenu, type DropdownMenuItem, type DropdownMenuProps } from './components/DropdownMenu';
export { EmptyState, type EmptyStateProps } from './components/EmptyState';
export { ErrorAlert, type ErrorAlertProps } from './components/ErrorAlert';
export {
  defaultErrorBoundaryLabels,
  ErrorBoundary,
  type ErrorBoundaryLabels,
  type ErrorBoundaryProps,
} from './components/ErrorBoundary';
export { FormField, useFormField, type FormFieldContextValue, type FormFieldProps } from './components/FormField';
export { HelpPopover, type HelpPopoverProps } from './components/HelpPopover';
export { InfoTip, type InfoTipPlacement, type InfoTipProps } from './components/InfoTip';
export { LoadingIndicator } from './components/LoadingIndicator';
export { MathSub, MathVar, type MathNotationProps } from './components/Math';
export { NumberInput, type NumberInputProps } from './components/NumberInput';
export { OptionCardGroup, type OptionCard, type OptionCardGroupProps } from './components/OptionCardGroup';
export { Select, type SelectOption, type SelectProps } from './components/Select';
export { Spinner, type SpinnerProps } from './components/Spinner';
export { Tab, TabPanel, Tabs, type TabPanelProps, type TabsProps } from './components/Tabs';
export { TextInput, type TextInputProps } from './components/TextInput';
export { notify, ToastHost } from './components/Toast';
export { Tooltip, type TooltipProps } from './components/Tooltip';
export { NavMenu, TopNav, type NavMenuItem } from './components/TopNav';

// MUI primitives re-exported so apps never import @mui directly (styled by the platform theme)
export { default as Box } from '@mui/material/Box';
export { default as Chip } from '@mui/material/Chip';
export { default as Divider } from '@mui/material/Divider';
export { default as Link } from '@mui/material/Link';
export { default as Stack } from '@mui/material/Stack';
export { default as Typography } from '@mui/material/Typography';

// Data grid
export { GridImageCell, GridLinkCell, type GridImageCellProps, type GridLinkCellProps } from './components/grid/GridCells';
export {
  isEmptyFilter,
  matchesNumberRange,
  matchesSearch,
  matchesSelect,
  matchesText,
  normalizeText,
  type GridFilterValue,
  type NumberRange,
} from './components/grid/gridFilters';
export { GridView, type GridViewProps } from './components/grid/GridView';
export {
  defaultGridViewLabels,
  type GridCellValue,
  type GridViewLabels,
  type GridColumn,
  type GridFilterType,
  type GridHighlight,
  type GridPreset,
  type GridViewState,
} from './components/grid/gridTypes';

// Release notes ("What's new")
export { compareVersions, formatReleaseDate, parseReleaseDate, sortReleases } from './components/release-notes/releaseNotesUtils';
export {
  defaultReleaseNotesLabels,
  ReleaseNotes,
  ReleaseNotesDialog,
  useReleaseNotesSeen,
  type ReleaseCategory,
  type ReleaseNote,
  type ReleaseNoteGroup,
  type ReleaseNoteSection,
  type ReleaseNotesDialogProps,
  type ReleaseNotesLabelOverrides,
  type ReleaseNotesLabels,
  type ReleaseNotesProps,
  type UseReleaseNotesSeenOptions,
} from './components/release-notes/ReleaseNotes';

// Workspace (three-section calculator layout)
export { ImageViewer, type ImageViewerHandle, type ImageViewerProps } from './components/workspace/ImageViewer';
export { Section, type SectionProps, type SectionTab } from './components/workspace/Section';
export { SectionLayout, Workspace, type SectionId, type SectionLayoutProps } from './components/workspace/SectionLayout';
export {
  defaultWorkspaceTabsLabels,
  WorkspaceTabs,
  type WorkspaceTab,
  type WorkspaceTabsLabels,
  type WorkspaceTabsProps,
} from './components/workspace/WorkspaceTabs';
export {
  DropOverlay,
  ResetViewButton,
  ViewControls,
  ViewControlsGroup,
  VisualizationStage,
  type VisualizationStageProps,
} from './components/workspace/Visualization';
