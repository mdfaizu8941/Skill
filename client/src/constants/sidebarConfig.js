export const sidebarConfig = {
  Student: [
    {
      group: 'Career & Placement',
      items: [
        { label: 'Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard' },
        { label: 'My Profile', path: '/student/profile', icon: 'User' },
        { label: 'Skills & Evidence', path: '/student/skills', icon: 'BookOpen' },
        { label: 'Career Roles', path: '/student/career-roles', icon: 'Briefcase' },
        { label: 'Gap Analysis', path: '/student/gap-analysis', icon: 'BarChart2' },
        { label: 'Roadmap', path: '/student/roadmap', icon: 'Map' },
        { label: 'Find a Mentor', path: '/student/mentor-discovery', icon: 'Search' },
        { label: 'Resume Parser', path: '/student/resume-parser', icon: 'FileText' },
        { label: 'Notifications', path: '/student/notifications', icon: 'Bell' },
      ],
    },
    {
      group: 'Skill Barter',
      items: [
        { label: 'Marketplace', path: '/student/barter/marketplace', icon: 'Store' },
        { label: 'My Skills', path: '/student/barter/my-skills', icon: 'Star' },
        { label: 'Post Skill', path: '/student/barter/post-skill', icon: 'PlusCircle' },
        { label: 'Exchanges', path: '/student/barter/exchanges', icon: 'ArrowLeftRight' },
        { label: 'Inbox', path: '/student/barter/inbox', icon: 'Inbox' },
        { label: 'Chat', path: '/student/barter/chat', icon: 'MessageCircle' },
        { label: 'Ratings', path: '/student/barter/ratings', icon: 'ThumbsUp' },
        { label: 'Barter Analytics', path: '/student/barter/analytics', icon: 'TrendingUp' },
      ],
    },
  ],
  Mentor: [
    {
      group: 'Mentor',
      items: [
        { label: 'My Profile', path: '/mentor/profile', icon: 'User' },
        { label: 'Dashboard', path: '/mentor/dashboard', icon: 'LayoutDashboard' },
        { label: 'Connection Requests', path: '/mentor/requests', icon: 'UserPlus' },
        { label: 'Evidence Review', path: '/mentor/evidence-review', icon: 'ClipboardCheck' },
        { label: 'Students', path: '/mentor/students', icon: 'Users' },
        { label: 'Notifications', path: '/mentor/notifications', icon: 'Bell' },
      ],
    },
  ],
  PlacementOfficer: [
    {
      group: 'Placement',
      items: [
        { label: 'Dashboard', path: '/officer/dashboard', icon: 'LayoutDashboard' },
        { label: 'Analytics', path: '/officer/analytics', icon: 'BarChart2' },
        { label: 'Reports', path: '/officer/reports', icon: 'FileDown' },
        { label: 'Student Search', path: '/officer/student-search', icon: 'Search' },
      ],
    },
  ],
  Admin: [
    {
      group: 'Admin',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
        { label: 'User Management', path: '/admin/users', icon: 'Users' },
        { label: 'Audit Logs', path: '/admin/audit-logs', icon: 'ScrollText' },
        { label: 'Role Catalog', path: '/admin/role-catalog', icon: 'Layers' },
      ],
    },
  ],
}
