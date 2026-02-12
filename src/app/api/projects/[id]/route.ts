import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, getUsers } from '@/lib/db';

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get full member details
    const users = await getUsers();
    const members = project.members
      .map((memberId) => users.find((u) => u.id === memberId))
      .filter(Boolean)
      .map((user) => ({
        id: user!.id,
        name: user!.name,
        department: user!.department,
        role: user!.role,
      }));

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        created_at: project.createdAt.toISOString(),
        members,
        member_count: members.length,
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, color, status, member_ids } = body;

    // Check if project exists
    const { getProjectById, getProjects, updateProject, getUsers } = await import('@/lib/db');
    const existingProject = await getProjectById(id);

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status !== undefined && status !== 'active' && status !== 'archived') {
      return NextResponse.json(
        { error: 'Status must be either "active" or "archived"' },
        { status: 400 }
      );
    }

    // Check for duplicate name if updating name
    if (name !== undefined && typeof name === 'string' && name.trim() !== '') {
      const allProjects = await getProjects();
      const duplicateProject = allProjects.find(
        (p) => p.name.toLowerCase() === name.trim().toLowerCase() && p.id !== id
      );

      if (duplicateProject) {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updates: any = {};
    
    if (name !== undefined && typeof name === 'string') {
      updates.name = name.trim();
    }

    if (description !== undefined && typeof description === 'string') {
      updates.description = description.trim();
    }

    if (color !== undefined && typeof color === 'string') {
      updates.color = color;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    // Validate member IDs if provided
    if (member_ids !== undefined && Array.isArray(member_ids)) {
      const users = await getUsers();
      const validMemberIds: string[] = [];
      
      for (const userId of member_ids) {
        if (typeof userId === 'string' && userId.trim() !== '') {
          const userExists = users.find((u) => u.id === userId.trim());
          if (userExists) {
            validMemberIds.push(userId.trim());
          }
        }
      }
      
      updates.members = validMemberIds;
    }

    // Update project using Prisma
    const project = await updateProject(id, updates);

    // Get full member details
    const users = await getUsers();
    const members = project.members
      .map((memberId) => users.find((u) => u.id === memberId))
      .filter(Boolean)
      .map((user) => ({
        id: user!.id,
        name: user!.name,
        department: user!.department,
        role: user!.role,
      }));

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        created_at: project.createdAt.toISOString(),
        members,
        member_count: members.length,
      },
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if project exists
    const { getProjectById, deleteProject } = await import('@/lib/db');
    const existingProject = await getProjectById(id);

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project using Prisma
    await deleteProject(id);

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
