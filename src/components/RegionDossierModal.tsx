import React from 'react';
import { ProvinceDossierModal } from './ProvinceDossierModal';

export interface RegionDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvinceCode: string;
  onSelectProvince: (code: string) => void;
  selectedRegionCode?: string;
  onSelectRegion?: (code: string) => void;
  mapLevel?: 'province' | 'region';
  onMapLevelChange?: (level: 'province' | 'region') => void;
}

export const RegionDossierModal: React.FC<RegionDossierModalProps> = (props) => {
  return <ProvinceDossierModal {...props} mapLevel={props.mapLevel || 'region'} />;
};
