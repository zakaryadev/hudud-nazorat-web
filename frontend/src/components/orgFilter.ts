import { useEffect, useState } from 'react';
import { AdminTerritory, api, OrgUser } from '../lib/api';
import { daysAgo, ymd } from '../lib/date';

export interface Filter { from: string; to: string; userId: string; territoryId: string }
export const defaultFilter = (): Filter => ({ from: daysAgo(6), to: ymd(), userId: '', territoryId: '' });

/** Admin ro'yxatlari uchun xodim va hududlar */
export function useOrgLists() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [territories, setTerritories] = useState<AdminTerritory[]>([]);
  useEffect(() => {
    api.users().then(setUsers).catch(() => {});
    api.territories().then(setTerritories).catch(() => {});
  }, []);
  return { users, territories };
}
