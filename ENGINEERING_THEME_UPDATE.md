# Engineering/Technical Documentation Theme Conversion

## 🔧 Theme Conversion Summary

We're converting from **Medical Research** to **Engineering/Technical Documentation** use case with a professional engineering theme.

## ⚡ Key Changes Made & Needed

### ✅ Backend Changes (api/app.py):
- ✅ Renamed `MEDICAL_MODELS` → `ENGINEERING_MODELS`
- ✅ Added CodeLlama-70b for code analysis 
- ✅ Renamed `get_medical_client()` → `get_engineering_client()`
- ✅ Renamed `get_medical_model()` → `get_engineering_model()`
- ✅ Renamed `create_medical_system_prompt()` → `create_engineering_system_prompt()`
- ✅ Updated system prompts for engineering focus
- ✅ Changed request model fields: `medical_specialty` → `engineering_specialty`, `evidence_level` → `analysis_depth`

### 🔄 Frontend Changes (frontend/app/page.tsx):
- ✅ Renamed state variables: `medicalMode` → `engineeringMode`, `medicalSpecialty` → `engineeringSpecialty`, `evidenceLevel` → `analysisDepth`
- ✅ Updated welcome message to engineering theme
- ✅ Updated header title logic
- 🔄 **REMAINING**: Many command handlers and UI elements still reference medical terms

## 🛠️ Engineering Specialties Added:
- **Software**: Architecture, code quality, design patterns, development practices
- **Systems**: System architecture, scalability, reliability, infrastructure
- **Network**: Protocols, security, performance, infrastructure
- **Security**: Security architecture, threat analysis, compliance
- **Data**: Data architecture, pipelines, storage, analytics
- **DevOps**: CI/CD, infrastructure as code, monitoring
- **API**: API design, documentation, integration patterns
- **Cloud**: Cloud architecture, services, optimization
- **Mobile**: Mobile app architecture, performance
- **Embedded**: Hardware-software integration, real-time systems

## 📊 Analysis Depths:
- **Deep**: Comprehensive technical analysis, architectural implications
- **Standard**: Balanced analysis, key aspects and recommendations  
- **Quick**: Rapid overview, critical issues and insights

## ⚡ Professional Engineering Commands:
- `/engineering` - Toggle engineering analysis mode
- `/depth [deep/standard/quick]` - Set analysis thoroughness
- `/specialty [software/systems/network/etc]` - Set engineering specialty
- `/provider [openai/together]` - Switch AI provider
- Enhanced `/help`, `/status`, `/files` for engineering context

## 🎨 Professional Theme Elements:
- **Colors**: Professional blues/grays instead of Mario colors
- **Icons**: Engineering symbols (⚡🔧🛠️📊) instead of medical (🏥🩺)
- **Language**: Technical terminology, professional tone
- **Focus**: Engineering teams, technical decision-making

## 🚧 Current Issues:
The frontend still has multiple references to medical terms that need to be converted to engineering terms. The linter errors indicate these locations need updates:

1. Command handlers (`/medical` → `/engineering`)
2. Status display (medical mode → engineering mode)
3. UI text and labels
4. Variable references throughout the file

## 🎯 Next Steps:
1. Complete frontend conversion from medical to engineering terms
2. Update CSS theme to professional engineering colors
3. Test all commands and functionality
4. Update documentation to reflect engineering focus
5. Deploy professional engineering documentation assistant

The system is now positioned as **TechLUIGI** - a professional engineering documentation assistant with Together AI integration for complex technical analysis. 