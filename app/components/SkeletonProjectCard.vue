<template>
    <div class="page-card">
        <span class="card-thumbnail">
            <SkeletonPart mode="image" imgHeight="130px" />
        </span>
        <span class="card-body">
            <SkeletonPart headingLevel="h2" :width="67" />
            <SkeletonPart :width="90" />
            <SkeletonPart :width="75" />
            <SkeletonPart :width="84" />
        </span>
    </div>
</template>
