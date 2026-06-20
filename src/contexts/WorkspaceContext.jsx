import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../services/db';
import { AuthContext } from './AuthContext';

export const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [members, setMembers] = useState([]);

  // Load workspaces and active workspace
  const loadWorkspaces = () => {
    if (!user) return;
    
    const allWorkspaces = db.getAll('workspaces');
    const allMemberships = db.getAll('workspaceMembers');
    
    // Filter workspaces where user is a member, or if admin/owner show all
    let userWorkspaces = [];
    if (user.role === 'owner' || user.isAdmin) {
      userWorkspaces = allWorkspaces;
    } else {
      const userWsIds = allMemberships
        .filter(m => m.userId === user.id)
        .map(m => m.workspaceId);
      userWorkspaces = allWorkspaces.filter(w => userWsIds.includes(w.id));
    }

    setWorkspaces(userWorkspaces);

    // Get active workspace ID from localStorage
    const savedActiveId = localStorage.getItem('fms_active_workspace_id');
    let active = userWorkspaces.find(w => w.id === savedActiveId);
    
    if (!active && userWorkspaces.length > 0) {
      // Fallback to first workspace
      active = userWorkspaces[0];
      localStorage.setItem('fms_active_workspace_id', active.id);
    }
    
    setActiveWorkspace(active || null);
  };

  useEffect(() => {
    loadWorkspaces();
  }, [user]);

  // Load members whenever active workspace changes
  useEffect(() => {
    if (!activeWorkspace) {
      setMembers([]);
      return;
    }

    const memberships = db.getAll('workspaceMembers', m => m.workspaceId === activeWorkspace.id);
    const users = db.getAll('users');
    
    const workspaceMembers = memberships.map(m => {
      const u = users.find(userObj => userObj.id === m.userId);
      return {
        ...m,
        username: u ? u.username : 'نامشخص',
        fullName: u ? u.fullName : 'کاربر حذف شده',
        status: u ? u.status : 'inactive',
        avatar: u ? u.avatar : ''
      };
    });

    setMembers(workspaceMembers);
  }, [activeWorkspace]);

  const switchWorkspace = (id) => {
    const ws = workspaces.find(w => w.id === id);
    if (ws) {
      setActiveWorkspace(ws);
      localStorage.setItem('fms_active_workspace_id', id);
      db.logAction('switch_workspace', 'workspaces', id, `تغییر به فضای کاری: ${ws.name}`);
    }
  };

  const createWorkspace = (workspaceData) => {
    if (!user) return;
    
    const newWs = db.insert('workspaces', {
      name: workspaceData.name,
      logo: workspaceData.logo || '',
      currency: workspaceData.currency || 'AFN',
      secondaryCurrency: workspaceData.secondaryCurrency || 'USD',
      exchangeRate: workspaceData.exchangeRate || 70,
      fiscalYearStart: workspaceData.fiscalYearStart || '01/01'
    });

    // Add creator as owner in workspaceMembers
    db.insert('workspaceMembers', {
      workspaceId: newWs.id,
      userId: user.id,
      role: 'owner'
    });

    loadWorkspaces();
    switchWorkspace(newWs.id);
    return newWs;
  };

  const updateWorkspace = (id, updates) => {
    const updated = db.update('workspaces', id, updates);
    if (updated) {
      loadWorkspaces();
      if (activeWorkspace && activeWorkspace.id === id) {
        setActiveWorkspace(updated);
      }
    }
    return updated;
  };

  const deleteWorkspace = (id) => {
    if (user.role !== 'owner') {
      throw new Error('فقط مالک سیستم می‌تواند فضای کاری را حذف کند');
    }
    
    const success = db.delete('workspaces', id);
    if (success) {
      // Delete memberships
      const memberships = db.getAll('workspaceMembers', m => m.workspaceId === id);
      memberships.forEach(m => db.delete('workspaceMembers', m.id));
      
      localStorage.removeItem('fms_active_workspace_id');
      loadWorkspaces();
    }
    return success;
  };

  const inviteMember = (username, role) => {
    if (!activeWorkspace) throw new Error('فضای کاری فعالی انتخاب نشده است');
    
    const users = db.getAll('users');
    const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!targetUser) {
      throw new Error('کاربری با این نام کاربری یافت نشد');
    }

    // Check if already a member
    const isMember = members.some(m => m.userId === targetUser.id);
    if (isMember) {
      throw new Error('این کاربر قبلاً عضو این فضای کاری شده است');
    }

    const newMembership = db.insert('workspaceMembers', {
      workspaceId: activeWorkspace.id,
      userId: targetUser.id,
      role: role || 'viewer'
    });

    // Also update members state
    setMembers(prev => [
      ...prev,
      {
        ...newMembership,
        username: targetUser.username,
        fullName: targetUser.fullName,
        status: targetUser.status,
        avatar: targetUser.avatar || ''
      }
    ]);

    db.logAction('invite_member', 'workspaceMembers', newMembership.id, `دعوت کاربر ${targetUser.fullName} به فضای کاری با نقش ${role}`);
    return newMembership;
  };

  const changeMemberRole = (membershipId, newRole) => {
    const updated = db.update('workspaceMembers', membershipId, { role: newRole });
    if (updated) {
      setMembers(prev => prev.map(m => m.id === membershipId ? { ...m, role: newRole } : m));
      db.logAction('change_member_role', 'workspaceMembers', membershipId, `تغییر نقش عضو در فضای کاری به ${newRole}`);
    }
    return updated;
  };

  const removeMember = (membershipId) => {
    const membership = db.getById('workspaceMembers', membershipId);
    if (!membership) return false;

    // Check if trying to remove the owner
    if (membership.role === 'owner') {
      throw new Error('نمی‌توان مالک فضای کاری را حذف کرد');
    }

    const success = db.delete('workspaceMembers', membershipId);
    if (success) {
      setMembers(prev => prev.filter(m => m.id !== membershipId));
      db.logAction('remove_member', 'workspaceMembers', membershipId, `حذف عضو از فضای کاری`);
    }
    return success;
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      members,
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      inviteMember,
      changeMemberRole,
      removeMember,
      reloadWorkspaces: loadWorkspaces
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
