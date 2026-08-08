import {FontStyleDTO} from "./FontStyleDTO";

export interface ResumeSettings {
  language: string;
  theme: "light" | "dark";
  card: {
    borderColor: string;
    backgroundColor: string;
  };
  title: {
    primary: FontStyleDTO;   // Candidate's name (Header)
    secondary: FontStyleDTO; // Macro section titles (e.g., PROFESSIONAL SUMMARY)
  };
  subtitle: {
    primary: FontStyleDTO;   // Candidate's Position (Header)
    secondary: FontStyleDTO; // Skill subcategories (e.g., LANGUAGES)
  };
  caption: {
    primary: FontStyleDTO;   // Companies / Academic Organizations
    secondary: FontStyleDTO; // Long descriptions / Bullets
  };
  meta: FontStyleDTO;        // Contact information, location, and time periods/dates
  chip: FontStyleDTO & {
    backgroundColor: string;
    borderColor: string;
  };
  backgroundColor?: string;
}

export interface ContactItem {
  title: string;
  link: string;
  icon: string;
}

export interface PersonalItem {
  name: string;
  title: string;
  location: ContactItem;
  contact: Array<ContactItem>;
}

export interface SkillsItem {
  title: string;
  items: Array<string>;
}

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  bullets: Array<string>;
}

export interface EducationItem {
  institution: string;
  role: string;
  period: string;
  description: string;
}

export interface ProjectItem {
  title: string;
  role: string;
  bullets: Array<string>;
}

export interface ResumeDTO {
  settings: ResumeSettings;
  personal: {
    title: string;
    personal: PersonalItem;
  };
  summary: {
    title: string;
    summary: string;
  };
  skills: {
    title: string;
    skills: Array<SkillsItem>;
  };
  experiences: {
    title: string;
    experiences: Array<ExperienceItem>;
  };
  education: {
    title: string;
    education: Array<EducationItem>;
  };
  projects: {
    title: string;
    projects: Array<ProjectItem>;
  };
}