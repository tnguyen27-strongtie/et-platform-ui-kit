import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { DropdownMenu, IconButton, NavMenu, Tooltip, TopNav, Typography, notify } from '@platform/ui';

type DialogName = 'settings' | 'about' | 'help' | 'releases';

export function AppNav({ onNew, onOpen }: { onNew: () => void; onOpen: (dialog: DialogName) => void }) {
  return (
    <TopNav
      logo={
        <Typography component="span" className="font-bold text-brand">
          Connection Calculator
        </Typography>
      }
      right={
        <>
          <Tooltip title="Settings">
            <IconButton aria-label="Settings" onClick={() => onOpen('settings')}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <DropdownMenu
            label="Account"
            variant="text"
            items={[
              { id: 'profile', label: 'Profile', onSelect: () => notify.info('Profile is not part of the PoC') },
              { id: 'beta', label: 'Beta features', onSelect: () => undefined, disabled: true },
              { id: 'sep', divider: true },
              { id: 'signout', label: 'Sign out', icon: <LogoutIcon />, onSelect: () => notify.warning('Signed out (simulated)'), danger: true },
            ]}
          />
        </>
      }
    >
      <NavMenu label="File" items={[{ id: 'new', label: 'New calculation', icon: <AddIcon />, onSelect: onNew }]} />
      <NavMenu
        label="Help"
        items={[
          { id: 'help', label: 'Help', onSelect: () => onOpen('help') },
          { id: 'releases', label: "What's new", onSelect: () => onOpen('releases') },
          { id: 'about', label: 'About', icon: <InfoOutlinedIcon />, onSelect: () => onOpen('about') },
        ]}
      />
    </TopNav>
  );
}
