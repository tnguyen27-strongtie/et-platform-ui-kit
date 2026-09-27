/**
 * Every showcase page and section. Single source for the sidebar, the overview and the
 * showcase e2e test (which checks each section renders and passes axe).
 */
export interface CatalogSection {
  id: string;
  title: string;
  /** Kit exports demonstrated in this section. */
  exports: string[];
}

export interface CatalogPage {
  page: string;
  title: string;
  description: string;
  sections: CatalogSection[];
}

export const catalog: CatalogPage[] = [
  {
    page: 'theme',
    title: 'Theme builder',
    description: 'Edit the colors and text size, check contrast, export the theme file and load it in your app.',
    sections: [
      { id: 'brand', title: 'Brand and text size', exports: ['definePlatformTheme', 'THEME_CONFIG_VERSION'] },
      { id: 'roles', title: 'Color roles', exports: ['COLOR_ROLES', 'isValidColor', 'parseRgb'] },
      { id: 'contrast', title: 'Contrast check', exports: ['contrastRatio'] },
      { id: 'export', title: 'Export and import', exports: ['themeConfigToJson', 'themeConfigToTs', 'normalizeThemeConfig', 'parseThemeConfig'] },
      { id: 'use', title: 'Use in a project', exports: [] },
    ],
  },
  {
    page: 'foundations',
    title: 'Foundations',
    description: 'Design tokens every component is built from. Colors follow the brand selected in the top bar.',
    sections: [
      { id: 'colors', title: 'Colors', exports: ['colors', 'defaultColors', 'scales'] },
      { id: 'typography', title: 'Typography', exports: ['Typography', 'typography'] },
      { id: 'math', title: 'Math formulas', exports: ['MathVar', 'MathSub'] },
      { id: 'tokens', title: 'Radius, shadow, spacing', exports: ['radius', 'shadows', 'spacingUnit', 'layout', 'breakpoints'] },
      { id: 'layout-primitives', title: 'Box and Stack', exports: ['Box', 'Stack'] },
    ],
  },
  {
    page: 'actions',
    title: 'Actions',
    description: 'Buttons and menus that start an action.',
    sections: [
      { id: 'button', title: 'Button', exports: ['Button'] },
      { id: 'icon-button', title: 'IconButton and CloseButton', exports: ['IconButton', 'CloseButton'] },
      { id: 'dropdown-menu', title: 'DropdownMenu', exports: ['DropdownMenu'] },
    ],
  },
  {
    page: 'forms',
    title: 'Forms',
    description: 'Inputs for calculator parameters. Put every control in a FormField: it wires the label, hint and error for screen readers.',
    sections: [
      { id: 'form-field', title: 'FormField', exports: ['FormField', 'useFormField'] },
      { id: 'text-input', title: 'TextInput', exports: ['TextInput'] },
      { id: 'number-input', title: 'NumberInput', exports: ['NumberInput'] },
      { id: 'select', title: 'Select', exports: ['Select'] },
      { id: 'combobox', title: 'Combobox', exports: ['Combobox'] },
      { id: 'checkbox-switch', title: 'Checkbox and Switch', exports: ['Checkbox', 'Switch'] },
      { id: 'radio-group', title: 'RadioGroup', exports: ['RadioGroup'] },
      { id: 'option-cards', title: 'OptionCardGroup', exports: ['OptionCardGroup'] },
    ],
  },
  {
    page: 'overlays',
    title: 'Overlays',
    description: 'Content shown above the page: hints, explanations, dialogs and toasts.',
    sections: [
      { id: 'tooltip', title: 'Tooltip (hover, short)', exports: ['Tooltip'] },
      { id: 'infotip', title: 'InfoTip (click, long)', exports: ['InfoTip', 'HelpPopover'] },
      { id: 'dialog', title: 'Dialog', exports: ['Dialog', 'DialogHeader', 'DialogBody', 'DialogFooter'] },
      { id: 'confirm-dialog', title: 'ConfirmDialog', exports: ['ConfirmDialog'] },
      { id: 'toast', title: 'Toast', exports: ['notify', 'ToastHost'] },
    ],
  },
  {
    page: 'navigation',
    title: 'Navigation',
    description: 'Moving between views and sections.',
    sections: [
      { id: 'top-nav', title: 'TopNav and NavMenu', exports: ['TopNav', 'NavMenu'] },
      { id: 'tabs', title: 'Tabs', exports: ['Tabs', 'Tab', 'TabPanel'] },
      { id: 'accordion', title: 'Accordion', exports: ['Accordion', 'useAccordionGroup', 'ExpandCollapseAllButton'] },
    ],
  },
  {
    page: 'data',
    title: 'Data display',
    description: 'Showing results: panels, tables and the data grid.',
    sections: [
      { id: 'card', title: 'Card', exports: ['Card'] },
      { id: 'description-list', title: 'DescriptionList', exports: ['DescriptionList'] },
      { id: 'data-table', title: 'DataTable', exports: ['DataTable'] },
      { id: 'grid-view', title: 'GridView', exports: ['GridView', 'defaultGridViewLabels'] },
      { id: 'grid-cells', title: 'Grid cells', exports: ['GridImageCell', 'GridLinkCell'] },
      { id: 'chip-link-divider', title: 'Chip, Link and Divider', exports: ['Chip', 'Link', 'Divider'] },
    ],
  },
  {
    page: 'feedback',
    title: 'Feedback',
    description: 'Status, progress, empty and error states.',
    sections: [
      { id: 'alert', title: 'Alert', exports: ['Alert'] },
      { id: 'error-alert', title: 'ErrorAlert', exports: ['ErrorAlert'] },
      { id: 'empty-state', title: 'EmptyState', exports: ['EmptyState'] },
      { id: 'loading', title: 'Spinner and LoadingIndicator', exports: ['Spinner', 'LoadingIndicator'] },
      { id: 'error-boundary', title: 'ErrorBoundary', exports: ['ErrorBoundary', 'defaultErrorBoundaryLabels'] },
    ],
  },
  {
    page: 'workspace',
    title: 'Workspace',
    description: 'The three-section calculator layout (Input, Illustration, Output) and its building blocks.',
    sections: [
      { id: 'section-layout', title: 'SectionLayout', exports: ['Workspace', 'SectionLayout'] },
      { id: 'section', title: 'Section', exports: ['Section'] },
      { id: 'visualization', title: 'VisualizationStage and ImageViewer', exports: ['VisualizationStage', 'ViewControls', 'ViewControlsGroup', 'ResetViewButton', 'ImageViewer'] },
      { id: 'drop-overlay', title: 'DropOverlay', exports: ['DropOverlay'] },
    ],
  },
  {
    page: 'patterns',
    title: 'Patterns',
    description: 'Ready-made pieces every app needs, driven by the app\'s own data.',
    sections: [
      {
        id: 'release-notes',
        title: 'Release notes',
        exports: ['ReleaseNotesDialog', 'ReleaseNotes', 'useReleaseNotesSeen', 'defaultReleaseNotesLabels', 'compareVersions', 'sortReleases', 'formatReleaseDate', 'parseReleaseDate'],
      },
      { id: 'agreement', title: 'Agreement', exports: ['AgreementDialog', 'useAgreementAccepted'] },
    ],
  },
  {
    page: 'utilities',
    title: 'Utilities',
    description: 'Helpers apps can reuse for validation, search and theming.',
    sections: [
      { id: 'number-helpers', title: 'Number helpers', exports: ['parseNumber', 'isPartialNumber', 'roundTo', 'stepNumber', 'formatNumber', 'formatDisplayNumber', 'formatFraction', 'clamp', 'decimalsOf', 'isInRange'] },
      { id: 'search-helpers', title: 'Search and filter helpers', exports: ['normalizeText', 'matchesText', 'matchesSearch', 'matchesNumberRange', 'matchesSelect', 'isEmptyFilter'] },
      { id: 'theme-helpers', title: 'Theme helpers', exports: ['resolveColors', 'colorCssVars', 'createPlatformTheme', 'PlatformThemeProvider', 'cn'] },
    ],
  },
];
