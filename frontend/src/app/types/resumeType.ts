import { Locale } from './translationType';

export interface PersonalDetails {
  name: string;
  title: string;  
  location: LocationItem;
  contact: ContactItems;
}

export interface SummaryDetails {
  summaryTitle: string;
  summary: string;
}

export interface SkillsDetails {
  skillsTitle: string;
  skills: Array<SkillItem>;
}

export interface ExperienceDetails {
  experienceTitle: string;
  experiences: Array<ExperienceItem>;
}

export interface EducationDetails {
  educationTitle: string;
  educations: Array<EducationItem>;
}

export interface ProjectDetails {
  projectTitle: string;
  projects: Array<ProjectItem>;
}

export interface LocationItem {
  location: string;
  link: string;
  icon: string;
}

export interface ContactItems {
  email: EmailItem;
  phone: PhoneItem;
  networking: Record<string, NetworkingItem>;
}

export interface EmailItem {
  email: string;
  icon: string;
}

export interface PhoneItem {
  phone: string;
  link: string;
  icon: string;
}

export interface NetworkingItem {
  name: string;
  url: string;
  icon: string;
}

export interface SkillItem {
  name: string;
  items: Array<string>;
}

export interface ExperienceItem {
  company: string;
  position: string;
  period: string;
  bullets: Array<string>;
}

export interface EducationItem {
  organization: string;
  degree: string;
  period: string;
  description: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  link?: string;
  bullets: Array<string>;
}

export interface ContactInfo {
  name: string;
  email: EmailItem;
  phone: PhoneItem;
  networking: Record<string, NetworkingItem>;
  location: LocationItem;
}

export interface ResumeExportOptions {
  locale: Locale;
  theme: 'light' | 'dark';
  fileName?: string;
}