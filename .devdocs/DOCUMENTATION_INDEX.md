# RIPPLY DOCUMENTATION INDEX

## Overview

This index provides a comprehensive guide to all documentation within the Ripply project, organized to help Taskmaster and developers understand the complete system architecture and development workflow.

---

## Documentation Structure

### 📁 `.devdocs/` - Project Architecture & Rules
The primary source of truth for project-specific architecture and rules.

| Document | Purpose | When to Reference |
|----------|---------|-------------------|
| **[ARCHITECTURE.md](.devdocs/ARCHITECTURE.md)** | Complete system architecture, patterns, and scalability | Before any task creation, when understanding system design |
| **[STORAGE_ARCHITECTURE.md](.devdocs/STORAGE_ARCHITECTURE.md)** | Media storage patterns and file handling | When working on media upload/download features |
| **[TASKMASTER_RULES.md](.devdocs/TASKMASTER_RULES.md)** | Rules and guidelines for Taskmaster operations | Before every task creation or modification |
| **[DOCUMENTATION_INDEX.md](.devdocs/DOCUMENTATION_INDEX.md)** | This document - navigation guide | When unsure about documentation structure |

### 📁 `.taskmaster/` - Task Management System
Internal Taskmaster operations and templates.

#### `.taskmaster/docs/`
| Document | Purpose | When to Reference |
|----------|---------|-------------------|
| **[SYSTEM_RULES.md](.taskmaster/docs/SYSTEM_RULES.md)** | Internal Taskmaster operation rules | For understanding how Taskmaster should behave |

#### `.taskmaster/templates/`
| Template | Purpose | When to Use |
|----------|---------|-------------|
| **[example_prd.txt](.taskmaster/templates/example_prd.txt)** | Generic PRD template | For any project, basic structure |
| **[ripply_prd_template.txt](.taskmaster/templates/ripply_prd_template.txt)** | Ripply-specific PRD template | For Ripply features, includes architecture context |

### 📁 `.roo/rules/` - Development Workflow & Code Standards
Roo-specific development patterns and tool configurations.

| Document | Purpose | When to Reference |
|----------|---------|-------------------|
| **[dev_workflow.md](.roo/rules/dev_workflow.md)** | Development workflow patterns | When setting up development processes |
| **[next-supabase-auth.md](.roo/rules/next-supabase-auth.md)** | Supabase authentication patterns | When working on auth features |
| **[react-native.md](.roo/rules/react-native.md)** | React Native development standards | For all frontend development |
| **[taskmaster.md](.roo/rules/taskmaster.md)** | Taskmaster integration with Roo | For understanding tool integration |

---

## Taskmaster Reference Workflow

### 🎯 **Before Creating Tasks**
1. **Read Project Rules**: [TASKMASTER_RULES.md](.devdocs/TASKMASTER_RULES.md)
2. **Understand Architecture**: [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md) - relevant sections
3. **Check Patterns**: [Existing codebase patterns](#codebase-patterns-reference)
4. **Follow Templates**: Use appropriate PRD template if needed

### 🔄 **During Task Development**
1. **Reference Architecture**: Link to specific [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md) sections
2. **Follow Code Standards**: Use [.roo/rules/](#roorules---development-workflow--code-standards) for implementation
3. **Security Check**: Verify against security patterns in architecture
4. **Integration Verify**: Ensure compatibility with existing patterns

### ✅ **After Task Completion**
1. **Update Documentation**: If new patterns emerge
2. **Cross-Reference**: Ensure consistency across all docs
3. **Learn & Improve**: Update rules based on learnings

---

## Codebase Patterns Reference

### Frontend Patterns (React Native + Expo)
```bash
# Component Architecture
frontend/components/[feature]/
├── hooks/              # Custom hooks for component logic
├── components/         # Sub-components
├── [Feature]Component.tsx
├── [Feature]Styles.ts
└── types.ts

# Reference: ARCHITECTURE.md - Frontend Architecture section
```

### Backend Patterns (Express.js + MVC)
```bash
# Service Layer Architecture
backend/src/
├── controllers/[feature]/
├── services/[feature]/
├── routes/
└── middleware/

# Reference: ARCHITECTURE.md - Backend Architecture section
```

### Database Patterns (Supabase)
```sql
-- Table naming: snake_case
-- RLS policies for security
-- Proper indexing for performance
-- Reference: ARCHITECTURE.md - Database Architecture section
```

---

## Documentation Maintenance

### 🔄 **Regular Updates Required**
- **Architecture Changes**: Update [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md) when patterns change
- **New Patterns**: Add to [TASKMASTER_RULES.md](.devdocs/TASKMASTER_RULES.md) when repeated
- **Template Evolution**: Update PRD templates as project needs evolve
- **Index Updates**: Keep this document current with new files

### 📊 **Quality Metrics**
- All tasks reference relevant architecture documentation
- New patterns are documented within 1 development cycle
- Documentation consistency across all files
- Cross-references remain valid and up-to-date

---

## Integration Points

### 🤝 **Taskmaster ↔ Architecture**
- Taskmaster reads architecture patterns before task creation
- Tasks reference specific architecture sections
- Implementation follows documented patterns
- Feedback loop updates architecture documentation

### 🤝 **Taskmaster ↔ Roo Rules**
- Taskmaster follows development workflow from Roo
- Code implementation uses Roo coding standards
- Tool integration follows Roo patterns
- Quality standards align between systems

### 🤝 **Architecture ↔ Implementation**
- Code follows patterns documented in architecture
- New patterns get documented in architecture
- Security implementations align with architecture security
- Performance follows architecture scalability guidelines

---

## Quick Reference

### 🚨 **Emergency Reference**
If unsure about anything:
1. Check [TASKMASTER_RULES.md](.devdocs/TASKMASTER_RULES.md) for project-specific guidance
2. Reference [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md) for technical patterns
3. Use [SYSTEM_RULES.md](.taskmaster/docs/SYSTEM_RULES.md) for operational guidance

### 🎯 **Common Use Cases**

#### Creating a New Feature
1. Use [ripply_prd_template.txt](.taskmaster/templates/ripply_prd_template.txt)
2. Reference [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md) for integration patterns
3. Follow [TASKMASTER_RULES.md](.devdocs/TASKMASTER_RULES.md) for task creation

#### Fixing a Bug
1. Identify affected architecture layer in [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md)
2. Check established patterns for proper implementation
3. Follow debugging guidelines in [SYSTEM_RULES.md](.taskmaster/docs/SYSTEM_RULES.md)

#### Optimizing Performance
1. Reference scalability sections in [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md)
2. Use research capabilities for latest best practices
3. Update architecture documentation with findings

### 📋 **Documentation Checklist**
Before completing any major work:
- [ ] Architecture documentation is current
- [ ] Task rules reflect current patterns
- [ ] Templates include latest requirements
- [ ] Cross-references are valid
- [ ] New patterns are documented

---

## Support & Troubleshooting

### 🔍 **Finding Information**
1. **Architecture Questions**: [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md)
2. **Task Creation**: [TASKMASTER_RULES.md](.devdocs/TASKMASTER_RULES.md)
3. **Implementation Standards**: [.roo/rules/](#roorules---development-workflow--code-standards)
4. **Operational Guidance**: [SYSTEM_RULES.md](.taskmaster/docs/SYSTEM_RULES.md)

### 🐛 **Common Issues**
- **Task doesn't follow patterns**: Check [TASKMASTER_RULES.md](.devdocs/TASKMASTER_RULES.md)
- **Architecture conflicts**: Reference [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md)
- **Implementation confusion**: Check [.roo/rules/](#roorules---development-workflow--code-standards)
- **Template issues**: Use correct template from [.taskmaster/templates/](#taskmastertemplates)

---

*This index ensures efficient navigation and consistent reference to all project documentation, enabling high-quality development and task management across the Ripply project.* 