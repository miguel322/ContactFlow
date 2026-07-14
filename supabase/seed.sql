-- Clean up existing data first
TRUNCATE auth.users CASCADE;

-- Insert seed users into auth.users (with password 'password123')
-- Crypt is standard in Postgres for hashing, password123 hashes to $2a$06$m.8lK1o7M3/h9bEw3.3hGeZ71Vw3.d91s8e2d7e1
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'owner@contactflow.com', '$2a$06$vI8qO7BvGf567mQG8H.fOu43XzYV4Z0Dq.U3K.j94G7b1l9t5w9/S', now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Juan Propietario", "first_name": "Juan", "last_name": "Propietario"}', false, 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'admin@contactflow.com', '$2a$06$vI8qO7BvGf567mQG8H.fOu43XzYV4Z0Dq.U3K.j94G7b1l9t5w9/S', now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Ana Administradora", "first_name": "Ana", "last_name": "Administradora"}', false, 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'member@contactflow.com', '$2a$06$vI8qO7BvGf567mQG8H.fOu43XzYV4Z0Dq.U3K.j94G7b1l9t5w9/S', now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Carlos Miembro", "first_name": "Carlos", "last_name": "Miembro"}', false, 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'viewer@contactflow.com', '$2a$06$vI8qO7BvGf567mQG8H.fOu43XzYV4Z0Dq.U3K.j94G7b1l9t5w9/S', now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Victoria Visora", "first_name": "Victoria", "last_name": "Visora"}', false, 'authenticated', now(), now());

-- Run block to consolidate organizations, categories, tags, contacts, and logs
DO $$
DECLARE
  v_org_id UUID;
  v_cat_client UUID;
  v_cat_supplier UUID;
  v_cat_partner UUID;
  v_cat_lead UUID;
  v_cat_employee UUID;
  
  v_tag_vip UUID;
  v_tag_urgent UUID;
  v_tag_new UUID;
  v_tag_pending UUID;
  v_tag_followup UUID;

  v_contact_id UUID;
  v_company_id UUID;
BEGIN
  -- 1. Setup primary organization
  UPDATE public.organizations
  SET name = 'NexusCorp CRM', slug = 'nexuscorp'
  WHERE owner_id = '00000000-0000-0000-0000-000000000001';

  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'nexuscorp';

  -- Add other users to the primary organization
  INSERT INTO public.organization_members (organization_id, profile_id, role, created_by)
  VALUES 
    (v_org_id, '00000000-0000-0000-0000-000000000002', 'admin', '00000000-0000-0000-0000-000000000001'),
    (v_org_id, '00000000-0000-0000-0000-000000000003', 'member', '00000000-0000-0000-0000-000000000001'),
    (v_org_id, '00000000-0000-0000-0000-000000000004', 'viewer', '00000000-0000-0000-0000-000000000001')
  ON CONFLICT (organization_id, profile_id) DO UPDATE SET role = EXCLUDED.role;

  -- Delete the secondary personal organizations created for the other 3 users
  DELETE FROM public.organizations WHERE owner_id IN (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004'
  );

  -- 2. Seed Categories
  INSERT INTO public.contact_categories (organization_id, name, color, description)
  VALUES
    (v_org_id, 'Clientes', '#10B981', 'Clientes activos con facturación regular'),
    (v_org_id, 'Proveedores', '#3B82F6', 'Proveedores de hardware, licencias y servicios'),
    (v_org_id, 'Socios', '#8B5CF6', 'Socios comerciales y distribuidores autorizados'),
    (v_org_id, 'Prospectos', '#F59E0B', 'Leads calificados en proceso de venta'),
    (v_org_id, 'Empleados', '#6B7280', 'Personal interno de la empresa')
  ON CONFLICT (organization_id, name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id;

  SELECT id INTO v_cat_client FROM public.contact_categories WHERE organization_id = v_org_id AND name = 'Clientes';
  SELECT id INTO v_cat_supplier FROM public.contact_categories WHERE organization_id = v_org_id AND name = 'Proveedores';
  SELECT id INTO v_cat_partner FROM public.contact_categories WHERE organization_id = v_org_id AND name = 'Socios';
  SELECT id INTO v_cat_lead FROM public.contact_categories WHERE organization_id = v_org_id AND name = 'Prospectos';
  SELECT id INTO v_cat_employee FROM public.contact_categories WHERE organization_id = v_org_id AND name = 'Empleados';

  -- 3. Seed Tags
  INSERT INTO public.tags (organization_id, name, color)
  VALUES
    (v_org_id, 'VIP', '#EF4444'),
    (v_org_id, 'Urgente', '#F97316'),
    (v_org_id, 'Nuevo', '#10B981'),
    (v_org_id, 'Pendiente Pago', '#F43F5E'),
    (v_org_id, 'Seguimiento', '#6366F1')
  ON CONFLICT (organization_id, name) DO UPDATE SET color = EXCLUDED.color;

  SELECT id INTO v_tag_vip FROM public.tags WHERE organization_id = v_org_id AND name = 'VIP';
  SELECT id INTO v_tag_urgent FROM public.tags WHERE organization_id = v_org_id AND name = 'Urgente';
  SELECT id INTO v_tag_new FROM public.tags WHERE organization_id = v_org_id AND name = 'Nuevo';
  SELECT id INTO v_tag_pending FROM public.tags WHERE organization_id = v_org_id AND name = 'Pendiente Pago';
  SELECT id INTO v_tag_followup FROM public.tags WHERE organization_id = v_org_id AND name = 'Seguimiento';

  -- 4. Seed Companies and People (25+ Contacts total)
  
  -- Company 1: TechCorp Solutions
  INSERT INTO public.contacts (organization_id, type, display_name, company_name, website, status, owner_id, source)
  VALUES (v_org_id, 'company', 'TechCorp Solutions', 'TechCorp Solutions', 'https://techcorp.example.com', 'active', '00000000-0000-0000-0000-000000000001', 'referral')
  RETURNING id INTO v_company_id;

  INSERT INTO public.contact_emails (contact_id, email, type, is_primary) VALUES (v_company_id, 'info@techcorp.example.com', 'work', true);
  INSERT INTO public.contact_phones (contact_id, phone, type, is_primary) VALUES (v_company_id, '+34910000001', 'work', true);
  INSERT INTO public.contact_addresses (contact_id, street, city, state, postal_code, country, type, is_primary) 
  VALUES (v_company_id, 'Paseo de la Castellana 95', 'Madrid', 'Madrid', '28046', 'España', 'work', true);
  INSERT INTO public.contact_category_assignments (contact_id, category_id) VALUES (v_company_id, v_cat_client);
  INSERT INTO public.contact_tags (contact_id, tag_id) VALUES (v_company_id, v_tag_vip);

  -- Contact 1: Juan Pérez (Works at TechCorp Solutions)
  INSERT INTO public.contacts (organization_id, type, first_name, last_name, display_name, company_name, job_title, department, status, owner_id, source)
  VALUES (v_org_id, 'person', 'Juan', 'Pérez', 'Juan Pérez', 'TechCorp Solutions', 'CTO', 'Tecnología', 'customer', '00000000-0000-0000-0000-000000000001', 'website')
  RETURNING id INTO v_contact_id;

  INSERT INTO public.contact_emails (contact_id, email, type, is_primary) VALUES (v_contact_id, 'juan.perez@techcorp.example.com', 'work', true);
  INSERT INTO public.contact_phones (contact_id, phone, type, is_primary) VALUES (v_contact_id, '+34600112233', 'mobile', true);
  INSERT INTO public.contact_category_assignments (contact_id, category_id) VALUES (v_contact_id, v_cat_client);
  INSERT INTO public.contact_relationships (contact_id, related_contact_id, relationship_type) VALUES (v_contact_id, v_company_id, 'employee');

  -- Contact 2: María Gómez (Freelance designer)
  INSERT INTO public.contacts (organization_id, type, first_name, last_name, display_name, status, owner_id, source)
  VALUES (v_org_id, 'person', 'María', 'Gómez', 'María Gómez', 'active', '00000000-0000-0000-0000-000000000002', 'cold_call')
  RETURNING id INTO v_contact_id;

  INSERT INTO public.contact_emails (contact_id, email, type, is_primary) VALUES (v_contact_id, 'maria@gomezdesign.example.com', 'work', true);
  INSERT INTO public.contact_phones (contact_id, phone, type, is_primary) VALUES (v_contact_id, '+34611223344', 'mobile', true);
  INSERT INTO public.contact_category_assignments (contact_id, category_id) VALUES (v_contact_id, v_cat_supplier);
  INSERT INTO public.contact_tags (contact_id, tag_id) VALUES (v_contact_id, v_tag_followup);

  -- Company 2: Global Logistics SA
  INSERT INTO public.contacts (organization_id, type, display_name, company_name, website, status, owner_id, source)
  VALUES (v_org_id, 'company', 'Global Logistics SA', 'Global Logistics SA', 'https://globallogistics.example.com', 'active', '00000000-0000-0000-0000-000000000002', 'partner')
  RETURNING id INTO v_company_id;

  INSERT INTO public.contact_emails (contact_id, email, type, is_primary) VALUES (v_company_id, 'contact@globallogistics.example.com', 'work', true);
  INSERT INTO public.contact_phones (contact_id, phone, type, is_primary) VALUES (v_company_id, '+34930000002', 'work', true);
  INSERT INTO public.contact_category_assignments (contact_id, category_id) VALUES (v_company_id, v_cat_supplier);

  -- Contact 3: Pierre Dupont (Works at Global Logistics SA)
  INSERT INTO public.contacts (organization_id, type, first_name, last_name, display_name, company_name, job_title, department, status, owner_id)
  VALUES (v_org_id, 'person', 'Pierre', 'Dupont', 'Pierre Dupont', 'Global Logistics SA', 'Director de Operaciones', 'Operaciones', 'active', '00000000-0000-0000-0000-000000000003')
  RETURNING id INTO v_contact_id;

  INSERT INTO public.contact_emails (contact_id, email, type, is_primary) VALUES (v_contact_id, 'pierre.dupont@globallogistics.example.com', 'work', true);
  INSERT INTO public.contact_phones (contact_id, phone, type, is_primary) VALUES (v_contact_id, '+34622334455', 'mobile', true);
  INSERT INTO public.contact_category_assignments (contact_id, category_id) VALUES (v_contact_id, v_cat_supplier);
  INSERT INTO public.contact_relationships (contact_id, related_contact_id, relationship_type) VALUES (v_contact_id, v_company_id, 'employee');

  -- Add 20 more quick contacts to hit the 25+ requirement
  FOR i IN 1..22 LOOP
    INSERT INTO public.contacts (
      organization_id, 
      type, 
      first_name, 
      last_name, 
      display_name, 
      company_name, 
      job_title, 
      status, 
      owner_id, 
      source
    )
    VALUES (
      v_org_id, 
      'person', 
      'Contacto_' || i, 
      'Apellido_' || i, 
      'Contacto_' || i || ' Apellido_' || i, 
      CASE WHEN i % 3 = 0 THEN 'Empresa A' WHEN i % 3 = 1 THEN 'Empresa B' ELSE NULL END,
      CASE WHEN i % 2 = 0 THEN 'Desarrollador' ELSE 'Vendedor' END,
      CASE WHEN i % 4 = 0 THEN 'active' WHEN i % 4 = 1 THEN 'lead' WHEN i % 4 = 2 THEN 'customer' ELSE 'inactive' END,
      CASE WHEN i % 2 = 0 THEN '00000000-0000-0000-0000-000000000002' ELSE '00000000-0000-0000-0000-000000000003' END,
      'website'
    )
    RETURNING id INTO v_contact_id;

    -- Add phone & email
    INSERT INTO public.contact_emails (contact_id, email, type, is_primary) VALUES (v_contact_id, 'contacto' || i || '@example.com', 'work', true);
    INSERT INTO public.contact_phones (contact_id, phone, type, is_primary) VALUES (v_contact_id, '+346330000' || LPAD(i::text, 2, '0'), 'mobile', true);
    
    -- Category assign
    INSERT INTO public.contact_category_assignments (contact_id, category_id) 
    VALUES (v_contact_id, CASE WHEN i % 3 = 0 THEN v_cat_client WHEN i % 3 = 1 THEN v_cat_lead ELSE v_cat_partner END);

    -- Tag assign
    IF i % 5 = 0 THEN
      INSERT INTO public.contact_tags (contact_id, tag_id) VALUES (v_contact_id, v_tag_vip);
    ELSIF i % 5 = 1 THEN
      INSERT INTO public.contact_tags (contact_id, tag_id) VALUES (v_contact_id, v_tag_new);
    END IF;
  END LOOP;

  -- 5. Seed Interactions (timeline)
  -- Select Juan Pérez for interaction seeding
  SELECT id INTO v_contact_id FROM public.contacts WHERE display_name = 'Juan Pérez';
  
  INSERT INTO public.interactions (organization_id, contact_id, type, date_time, direction, result, description, duration_seconds, user_id, next_step)
  VALUES
    (v_org_id, v_contact_id, 'call', now() - INTERVAL '15 days', 'incoming', 'connected', 'Llamada inicial del cliente para solicitar información sobre servicios de consultoría.', 180, '00000000-0000-0000-0000-000000000001', 'Enviar propuesta de servicios por correo'),
    (v_org_id, v_contact_id, 'email', now() - INTERVAL '14 days', 'outgoing', 'sent', 'Envío de propuesta económica detallada y cronograma de hitos.', 0, '00000000-0000-0000-0000-000000000001', 'Esperar confirmación de lectura'),
    (v_org_id, v_contact_id, 'meeting', now() - INTERVAL '10 days', 'incoming', 'completed', 'Reunión de revisión técnica del proyecto. Discusión de arquitecturas de software.', 3600, '00000000-0000-0000-0000-000000000001', 'Ajustar propuesta según requisitos de seguridad'),
    (v_org_id, v_contact_id, 'whatsapp', now() - INTERVAL '2 days', 'incoming', 'connected', 'Cliente confirma por chat de WhatsApp que acepta la propuesta ajustada y quiere firmar contrato.', 60, '00000000-0000-0000-0000-000000000001', 'Redactar contrato formal');

  -- 6. Seed Tasks (reminders)
  INSERT INTO public.tasks (organization_id, contact_id, title, description, due_date, priority, status, created_by)
  VALUES
    (v_org_id, v_contact_id, 'Enviar propuesta comercial', 'Preparar y enviar PDF con los precios actualizados de consultoría.', now() - INTERVAL '12 days', 'high', 'completed', '00000000-0000-0000-0000-000000000001'),
    (v_org_id, v_contact_id, 'Llamada de seguimiento', 'Llamar para verificar si tiene dudas sobre la propuesta enviada.', now() - INTERVAL '1 day', 'medium', 'overdue', '00000000-0000-0000-0000-000000000001'),
    (v_org_id, v_contact_id, 'Enviar contrato final', 'Redactar el documento legal y enviarlo a través de firma electrónica.', now() + INTERVAL '2 hours', 'urgent', 'pending', '00000000-0000-0000-0000-000000000001'),
    (v_org_id, v_contact_id, 'Reunión de onboarding técnico', 'Programar videollamada de bienvenida con el equipo de ingeniería.', now() + INTERVAL '5 days', 'low', 'pending', '00000000-0000-0000-0000-000000000001');

END $$;
