import { describe, expect, it } from 'vitest';
import { staffMembers, workTasks } from '../../src/db/schema';

describe('staff ownership schema', () => {
  it('stores tenant-scoped staff identity and availability', () => {
    for (const column of ['id', 'contractorId', 'name', 'role', 'status', 'availability']) expect(Object.keys(staffMembers)).toContain(column);
  });
  it('stores an optional named staff owner on human work tasks', () => { expect(Object.keys(workTasks)).toContain('assignedStaffId'); });
});
