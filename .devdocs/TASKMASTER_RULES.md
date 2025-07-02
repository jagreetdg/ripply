# TASKMASTER PROJECT RULES

## Overview

This document defines the rules and guidelines that Taskmaster should follow when working on the Ripply project. These rules ensure consistency, quality, and alignment with the project architecture.

---

## Architecture Compliance

### 📋 **Required Reading**
Before creating or updating tasks, Taskmaster must reference:
- [ARCHITECTURE.md](.devdocs/ARCHITECTURE.md) - Complete system architecture
- [STORAGE_ARCHITECTURE.md](.devdocs/STORAGE_ARCHITECTURE.md) - Media storage patterns

### 🏗️ **Architecture Principles**
1. **Follow the 3-tier pattern**: Frontend (React Native) → Backend (Express.js) → Database (Supabase)
2. **Respect the MVC structure** in backend tasks
3. **Use established service patterns** for business logic
4. **Maintain security best practices** as outlined in architecture docs

---

## Task Creation Rules

### 🎯 **Task Quality Standards**
- **Specific & Actionable**: Each task must have clear, implementable requirements
- **Architecture Aligned**: Tasks must follow the established patterns in ARCHITECTURE.md
- **Dependency Aware**: Respect the logical order defined in architecture docs
- **Testable**: Include clear acceptance criteria and test strategies

### 📝 **Required Task Fields**
```json
{
  "title": "Clear, actionable title",
  "description": "Brief overview referencing architecture patterns",
  "details": "Specific implementation steps following established patterns",
  "testStrategy": "How to verify completion",
  "dependencies": ["List of prerequisite task IDs"],
  "priority": "Based on architecture dependency chain"
}
```

### 🔍 **Task Breakdown Guidelines**
- **Frontend tasks**: Must reference component architecture patterns
- **Backend tasks**: Must follow MVC service layer patterns  
- **Database tasks**: Must align with schema and storage architecture
- **API tasks**: Must follow established endpoint patterns
- **Security tasks**: Must reference security architecture guidelines

---

## Development Workflow Rules

### 🚀 **Task Progression**
1. **Foundation First**: Database schema and core API endpoints
2. **Service Layer**: Business logic implementation following MVC patterns
3. **Frontend Core**: Basic UI following component architecture
4. **Integration**: API connections and data flow
5. **Polish**: UI/UX enhancements and optimizations

### 📊 **Priority Assignment**
- **Critical**: Core architecture components, security, data integrity
- **High**: User-facing features, API endpoints, authentication
- **Medium**: UI enhancements, optimizations, additional features
- **Low**: Documentation, minor improvements, nice-to-haves

### 🔄 **Update Requirements**
When implementation differs from plans:
- Reference architecture docs to ensure alignment
- Update dependent tasks if architecture impacts change
- Maintain consistency with established patterns

---

## Code Quality Rules

### 🎨 **Frontend Standards** (React Native + Expo)
- Follow component architecture patterns from ARCHITECTURE.md
- Use established state management (React Context + AsyncStorage)
- Implement proper error handling and loading states
- Follow security patterns for authentication and data handling

### ⚙️ **Backend Standards** (Express.js)
- Follow MVC pattern with service layers
- Use established Supabase client patterns
- Implement proper error handling and validation
- Follow security headers and CORS patterns

### 🗄️ **Database Standards** (Supabase)
- Follow schema patterns from ARCHITECTURE.md
- Use established table relationships and indexes
- Implement proper RLS policies
- Follow storage bucket organization

---

## Research & Learning Rules

### 🔬 **When to Use Research**
- Before implementing new patterns not covered in architecture docs
- When encountering security-related tasks
- For performance optimization tasks
- When updating dependencies or integrating new libraries

### 📚 **Research Context**
Always include:
- Current architecture patterns from docs
- Existing implementation examples
- Security considerations from architecture
- Performance implications

---

## Error Handling & Debugging

### 🐛 **Common Issues Reference**
- Authentication flow problems → Reference security architecture
- Database connection issues → Reference data layer patterns
- API integration problems → Reference communication architecture
- UI state management → Reference frontend architecture patterns

### 🔧 **Debugging Approach**
1. Check against architecture documentation first
2. Verify implementation follows established patterns
3. Reference existing working examples in codebase
4. Use research for external best practices if needed

---

## Documentation Maintenance

### 📖 **When to Update This File**
- New architecture patterns are established
- Major technical decisions are made
- Common issues or patterns emerge
- Project requirements significantly change

### 🔗 **Cross-References**
- Link all tasks to relevant architecture sections
- Reference specific patterns and examples
- Maintain consistency across all documentation

---

## Quick Reference

### 🎯 **Before Creating Tasks**
1. ✅ Read relevant architecture documentation
2. ✅ Identify which architecture patterns apply
3. ✅ Check for existing similar implementations
4. ✅ Define clear acceptance criteria
5. ✅ Set appropriate dependencies and priorities

### 🔄 **Before Major Updates**  
1. ✅ Review impact on architecture
2. ✅ Check dependent tasks for conflicts
3. ✅ Verify security implications
4. ✅ Update related documentation if needed

---

*This document should be referenced by Taskmaster for all project operations to ensure consistency with the established architecture and development patterns.* 