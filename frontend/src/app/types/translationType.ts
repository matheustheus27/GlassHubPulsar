import { PersonalDetails, SummaryDetails, SkillsDetails, ExperienceDetails, EducationDetails, ProjectDetails } from './resumeType';
import { CoverLetterDetails } from './coverLetterType';

export type Locale = 'pt-BR' | 'en-US';

export interface TranslationDict {
  personalDetails: PersonalDetails;
  summaryDetails: SummaryDetails;
  skillsDetails: SkillsDetails;
  experienceDetails: ExperienceDetails;
  educationDetails: EducationDetails;
  projectDetails: ProjectDetails;
  coverLetterDetails: CoverLetterDetails;
}