-- Create profiles table first
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organization members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (organization_id, profile_id)
);

-- Create organization invitations
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  locale TEXT DEFAULT 'es' CHECK (locale IN ('es', 'en')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('person', 'company')),
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  display_name TEXT NOT NULL,
  company_name TEXT,
  job_title TEXT,
  department TEXT,
  description TEXT,
  birth_date DATE,
  website TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'lead', 'customer', 'supplier', 'employee', 'archived')),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create contact phones
CREATE TABLE IF NOT EXISTS public.contact_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('work', 'home', 'mobile', 'other')),
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact emails
CREATE TABLE IF NOT EXISTS public.contact_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('work', 'personal', 'other')),
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact addresses
CREATE TABLE IF NOT EXISTS public.contact_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  type TEXT NOT NULL CHECK (type IN ('work', 'home', 'billing', 'shipping', 'other')),
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact social profiles
CREATE TABLE IF NOT EXISTS public.contact_social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'github', 'other')),
  url TEXT,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact relationships
CREATE TABLE IF NOT EXISTS public.contact_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  related_contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact categories
CREATE TABLE IF NOT EXISTS public.contact_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (organization_id, name)
);

-- Create contact category assignments
CREATE TABLE IF NOT EXISTS public.contact_category_assignments (
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.contact_categories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (contact_id, category_id)
);

-- Create tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (organization_id, name)
);

-- Create contact tags link table
CREATE TABLE IF NOT EXISTS public.contact_tags (
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (contact_id, tag_id)
);

-- Create interactions
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'message', 'whatsapp', 'videocall', 'visit', 'general_note', 'other')),
  date_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  result TEXT,
  description TEXT,
  duration_seconds INTEGER,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  next_step TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create interaction attachments
CREATE TABLE IF NOT EXISTS public.interaction_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact notes
CREATE TABLE IF NOT EXISTS public.contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')) DEFAULT 'pending',
  recurrence_rule TEXT,
  notes TEXT,
  notify_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create task assignees
CREATE TABLE IF NOT EXISTS public.task_assignees (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (task_id, profile_id)
);

-- Create notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact files (Supabase Storage reference)
CREATE TABLE IF NOT EXISTS public.contact_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create custom field definitions
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'long_text', 'number', 'date', 'boolean', 'select', 'email', 'phone', 'url')),
  options TEXT[],
  is_required BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (organization_id, name)
);

-- Create custom field values
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  field_definition_id UUID REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (contact_id, field_definition_id)
);

-- Create saved contact views
CREATE TABLE IF NOT EXISTS public.saved_contact_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb NOT NULL,
  columns TEXT[],
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create import jobs
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  total_rows INTEGER DEFAULT 0 NOT NULL,
  processed_rows INTEGER DEFAULT 0 NOT NULL,
  imported_rows INTEGER DEFAULT 0 NOT NULL,
  updated_rows INTEGER DEFAULT 0 NOT NULL,
  skipped_rows INTEGER DEFAULT 0 NOT NULL,
  failed_rows INTEGER DEFAULT 0 NOT NULL,
  duplicate_strategy TEXT NOT NULL CHECK (duplicate_strategy IN ('skip', 'update', 'create')) DEFAULT 'skip',
  file_name TEXT,
  file_size INTEGER,
  error_message TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create import job errors
CREATE TABLE IF NOT EXISTS public.import_job_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.import_jobs(id) ON DELETE CASCADE NOT NULL,
  row_index INTEGER NOT NULL,
  raw_data JSONB,
  error_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create external integrations
CREATE TABLE IF NOT EXISTS public.external_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_contacts', 'outlook_contacts')),
  credentials JSONB,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (organization_id, provider)
);

-- Create external contact mappings
CREATE TABLE IF NOT EXISTS public.external_contact_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.external_integrations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (integration_id, contact_id),
  UNIQUE (integration_id, external_id)
);

-- Create sync logs
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.external_integrations(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore', 'invite', 'role_change', 'owner_transfer')),
  entity_name TEXT NOT NULL,
  entity_id UUID,
  previous_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create common triggers to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all business tables
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER set_organization_members_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_organization_invitations_updated_at ON public.organization_invitations;
CREATE TRIGGER set_organization_invitations_updated_at BEFORE UPDATE ON public.organization_invitations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contacts_updated_at ON public.contacts;
CREATE TRIGGER set_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contact_phones_updated_at ON public.contact_phones;
CREATE TRIGGER set_contact_phones_updated_at BEFORE UPDATE ON public.contact_phones FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contact_emails_updated_at ON public.contact_emails;
CREATE TRIGGER set_contact_emails_updated_at BEFORE UPDATE ON public.contact_emails FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contact_addresses_updated_at ON public.contact_addresses;
CREATE TRIGGER set_contact_addresses_updated_at BEFORE UPDATE ON public.contact_addresses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contact_social_profiles_updated_at ON public.contact_social_profiles;
CREATE TRIGGER set_contact_social_profiles_updated_at BEFORE UPDATE ON public.contact_social_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contact_relationships_updated_at ON public.contact_relationships;
CREATE TRIGGER set_contact_relationships_updated_at BEFORE UPDATE ON public.contact_relationships FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contact_categories_updated_at ON public.contact_categories;
CREATE TRIGGER set_contact_categories_updated_at BEFORE UPDATE ON public.contact_categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_tags_updated_at ON public.tags;
CREATE TRIGGER set_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_interactions_updated_at ON public.interactions;
CREATE TRIGGER set_interactions_updated_at BEFORE UPDATE ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contact_notes_updated_at ON public.contact_notes;
CREATE TRIGGER set_contact_notes_updated_at BEFORE UPDATE ON public.contact_notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_contact_files_updated_at ON public.contact_files;
CREATE TRIGGER set_contact_files_updated_at BEFORE UPDATE ON public.contact_files FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_custom_field_definitions_updated_at ON public.custom_field_definitions;
CREATE TRIGGER set_custom_field_definitions_updated_at BEFORE UPDATE ON public.custom_field_definitions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_custom_field_values_updated_at ON public.custom_field_values;
CREATE TRIGGER set_custom_field_values_updated_at BEFORE UPDATE ON public.custom_field_values FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_saved_contact_views_updated_at ON public.saved_contact_views;
CREATE TRIGGER set_saved_contact_views_updated_at BEFORE UPDATE ON public.saved_contact_views FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_import_jobs_updated_at ON public.import_jobs;
CREATE TRIGGER set_import_jobs_updated_at BEFORE UPDATE ON public.import_jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_external_integrations_updated_at ON public.external_integrations;
CREATE TRIGGER set_external_integrations_updated_at BEFORE UPDATE ON public.external_integrations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_external_contact_mappings_updated_at ON public.external_contact_mappings;
CREATE TRIGGER set_external_contact_mappings_updated_at BEFORE UPDATE ON public.external_contact_mappings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger function for automatic profile creation and default organization mapping on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  org_slug TEXT;
  display_name TEXT;
BEGIN
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, first_name, last_name, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(display_name, ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(display_name, ' ', 2)),
    display_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  org_id := gen_random_uuid();
  org_slug := 'org-' || substring(NEW.id::text from 25 for 12);

  INSERT INTO public.organizations (id, name, slug, owner_id, created_by)
  VALUES (org_id, 'Organización Personal', org_slug, NEW.id, NEW.id);

  INSERT INTO public.organization_members (organization_id, profile_id, role, created_by)
  VALUES (org_id, NEW.id, 'owner', NEW.id);

  INSERT INTO public.user_preferences (profile_id, theme, locale)
  VALUES (NEW.id, 'light', 'es');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to get current user organization role
CREATE OR REPLACE FUNCTION public.current_user_role(org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.organization_members
  WHERE organization_id = org_id AND profile_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if current user is member of organization
CREATE OR REPLACE FUNCTION public.has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND profile_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_contact_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_job_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_contact_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.organization_members m1 WHERE m1.profile_id = auth.uid() AND EXISTS (SELECT 1 FROM public.organization_members m2 WHERE m2.organization_id = m1.organization_id AND m2.profile_id = profiles.id)));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Organizations Policies
CREATE POLICY orgs_select ON public.organizations FOR SELECT USING (public.has_org_access(id));
CREATE POLICY orgs_update ON public.organizations FOR UPDATE USING (public.current_user_role(id) IN ('owner', 'admin'));
CREATE POLICY orgs_delete ON public.organizations FOR DELETE USING (public.current_user_role(id) = 'owner');

-- Organization Members Policies
CREATE POLICY members_select ON public.organization_members FOR SELECT USING (public.has_org_access(organization_id));
CREATE POLICY members_insert ON public.organization_members FOR INSERT WITH CHECK (public.current_user_role(organization_id) IN ('owner', 'admin'));
CREATE POLICY members_update ON public.organization_members FOR UPDATE USING (public.current_user_role(organization_id) IN ('owner', 'admin') AND profile_id != auth.uid());
CREATE POLICY members_delete ON public.organization_members FOR DELETE USING (public.current_user_role(organization_id) IN ('owner', 'admin') AND (role != 'owner' OR public.current_user_role(organization_id) = 'owner'));

-- Invitations Policies
CREATE POLICY invs_select ON public.organization_invitations FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR public.has_org_access(organization_id));
CREATE POLICY invs_insert ON public.organization_invitations FOR INSERT WITH CHECK (public.current_user_role(organization_id) IN ('owner', 'admin'));
CREATE POLICY invs_write ON public.organization_invitations FOR ALL USING (public.current_user_role(organization_id) IN ('owner', 'admin'));

-- User Preferences Policies
CREATE POLICY pref_all ON public.user_preferences FOR ALL USING (profile_id = auth.uid());

-- Contacts Policies
CREATE POLICY contacts_select ON public.contacts FOR SELECT USING (public.has_org_access(organization_id));
CREATE POLICY contacts_insert ON public.contacts FOR INSERT WITH CHECK (public.current_user_role(organization_id) IN ('owner', 'admin', 'member'));
CREATE POLICY contacts_update ON public.contacts FOR UPDATE USING (public.current_user_role(organization_id) IN ('owner', 'admin', 'member'));
CREATE POLICY contacts_delete ON public.contacts FOR DELETE USING (public.current_user_role(organization_id) IN ('owner', 'admin'));

-- Subtables of contacts policies (cascade verification)
CREATE POLICY phones_all ON public.contact_phones FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.has_org_access(c.organization_id)));
CREATE POLICY emails_all ON public.contact_emails FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.has_org_access(c.organization_id)));
CREATE POLICY addresses_all ON public.contact_addresses FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.has_org_access(c.organization_id)));
CREATE POLICY socials_all ON public.contact_social_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.has_org_access(c.organization_id)));
CREATE POLICY rels_all ON public.contact_relationships FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.has_org_access(c.organization_id)));

-- Categories Policies
CREATE POLICY cats_select ON public.contact_categories FOR SELECT USING (public.has_org_access(organization_id));
CREATE POLICY cats_write ON public.contact_categories FOR ALL USING (public.current_user_role(organization_id) IN ('owner', 'admin'));
CREATE POLICY cat_assigns_all ON public.contact_category_assignments FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.has_org_access(c.organization_id)));

-- Tags Policies
CREATE POLICY tags_select ON public.tags FOR SELECT USING (public.has_org_access(organization_id));
CREATE POLICY tags_write ON public.tags FOR ALL USING (public.current_user_role(organization_id) IN ('owner', 'admin'));
CREATE POLICY tag_links_all ON public.contact_tags FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.has_org_access(c.organization_id)));

-- Interactions Policies
CREATE POLICY ints_select ON public.interactions FOR SELECT USING (public.has_org_access(organization_id));
CREATE POLICY ints_write ON public.interactions FOR ALL USING (public.current_user_role(organization_id) IN ('owner', 'admin', 'member'));
CREATE POLICY int_attach_all ON public.interaction_attachments FOR ALL USING (EXISTS (SELECT 1 FROM public.interactions i WHERE i.id = interaction_id AND public.has_org_access(i.organization_id)));

-- Contact Notes Policies (Supports private notes)
CREATE POLICY notes_select ON public.contact_notes FOR SELECT USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.has_org_access(c.organization_id)) AND (NOT is_private OR profile_id = auth.uid()));
CREATE POLICY notes_write ON public.contact_notes FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.current_user_role(c.organization_id) IN ('owner', 'admin', 'member')));

-- Tasks Policies
CREATE POLICY tasks_select ON public.tasks FOR SELECT USING (public.has_org_access(organization_id));
CREATE POLICY tasks_write ON public.tasks FOR ALL USING (public.current_user_role(organization_id) IN ('owner', 'admin', 'member'));
CREATE POLICY task_assignees_all ON public.task_assignees FOR ALL USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND public.has_org_access(t.organization_id)));

-- Notifications Policies
CREATE POLICY notifs_all ON public.notifications FOR ALL USING (profile_id = auth.uid() AND public.has_org_access(organization_id));

-- Contact Files Policies
CREATE POLICY files_select ON public.contact_files FOR SELECT USING (public.has_org_access(organization_id));
CREATE POLICY files_write ON public.contact_files FOR ALL USING (public.current_user_role(organization_id) IN ('owner', 'admin', 'member'));

-- Custom Fields Policies
CREATE POLICY defs_select ON public.custom_field_definitions FOR SELECT USING (public.has_org_access(organization_id));
CREATE POLICY defs_write ON public.custom_field_definitions FOR ALL USING (public.current_user_role(organization_id) IN ('owner', 'admin'));
CREATE POLICY vals_select ON public.custom_field_values FOR SELECT USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.has_org_access(c.organization_id)));
CREATE POLICY vals_write ON public.custom_field_values FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND public.current_user_role(c.organization_id) IN ('owner', 'admin', 'member')));

-- Saved Views Policies
CREATE POLICY views_all ON public.saved_contact_views FOR ALL USING (profile_id = auth.uid() AND public.has_org_access(organization_id));

-- Import Jobs Policies
CREATE POLICY imports_all ON public.import_jobs FOR ALL USING (public.has_org_access(organization_id));
CREATE POLICY import_errors_all ON public.import_job_errors FOR ALL USING (EXISTS (SELECT 1 FROM public.import_jobs j WHERE j.id = job_id AND public.has_org_access(j.organization_id)));

-- Integrations Policies
CREATE POLICY integrs_all ON public.external_integrations FOR ALL USING (public.has_org_access(organization_id));
CREATE POLICY integr_maps_all ON public.external_contact_mappings FOR ALL USING (EXISTS (SELECT 1 FROM public.external_integrations i WHERE i.id = integration_id AND public.has_org_access(i.organization_id)));
CREATE POLICY sync_logs_all ON public.sync_logs FOR ALL USING (EXISTS (SELECT 1 FROM public.external_integrations i WHERE i.id = integration_id AND public.has_org_access(i.organization_id)));

-- Audit Logs Policies (Select-only for Owner and Admin)
CREATE POLICY audit_select ON public.audit_logs FOR SELECT USING (public.current_user_role(organization_id) IN ('owner', 'admin'));

-- Trigger function for audit log tracking
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_profile_id UUID;
  v_action TEXT;
  v_entity_name TEXT;
  v_entity_id UUID;
  v_old_val JSONB := NULL;
  v_new_val JSONB := NULL;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_action := 'create';
    v_new_val := to_jsonb(NEW);
    v_entity_id := NEW.id;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'update';
    v_old_val := to_jsonb(OLD);
    v_new_val := to_jsonb(NEW);
    v_entity_id := NEW.id;
    -- Detect soft-delete and restore actions
    IF v_old_val ? 'deleted_at' AND v_new_val ? 'deleted_at' THEN
      IF (v_old_val->>'deleted_at') IS NULL AND (v_new_val->>'deleted_at') IS NOT NULL THEN
        v_action := 'delete';
      ELSIF (v_old_val->>'deleted_at') IS NOT NULL AND (v_new_val->>'deleted_at') IS NULL THEN
        v_action := 'restore';
      END IF;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'delete';
    v_old_val := to_jsonb(OLD);
    v_entity_id := OLD.id;
  END IF;

  v_entity_name := TG_TABLE_NAME;
  v_profile_id := auth.uid();

  IF TG_TABLE_NAME = 'organizations' THEN
    v_org_id := COALESCE(NEW.id, OLD.id);
  ELSE
    BEGIN
      IF TG_OP = 'DELETE' THEN
        v_org_id := OLD.organization_id;
      ELSE
        v_org_id := NEW.organization_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_org_id := NULL;
    END;
  END IF;

  IF v_org_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (organization_id, profile_id, action, entity_name, entity_id, previous_values, new_values)
    VALUES (v_org_id, v_profile_id, v_action, v_entity_name, v_entity_id, v_old_val, v_new_val);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach auditing triggers to main entities
DROP TRIGGER IF EXISTS audit_organizations ON public.organizations;
CREATE TRIGGER audit_organizations AFTER INSERT OR UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_members ON public.organization_members;
CREATE TRIGGER audit_members AFTER INSERT OR UPDATE OR DELETE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_contacts ON public.contacts;
CREATE TRIGGER audit_contacts AFTER INSERT OR UPDATE OR DELETE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_interactions ON public.interactions;
CREATE TRIGGER audit_interactions AFTER INSERT OR UPDATE OR DELETE ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_tasks ON public.tasks;
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_files ON public.contact_files;
CREATE TRIGGER audit_files AFTER INSERT OR UPDATE OR DELETE ON public.contact_files FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
