<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.tei-c.org/ns/1.0"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:array="http://www.w3.org/2005/xpath-functions/array" xmlns:map="http://www.w3.org/2005/xpath-functions/map" exclude-result-prefixes="xs tei"
    version="3.0">
    <xsl:output method="text"/>
    <xsl:mode on-no-match="shallow-skip"/>
    <xsl:template match="/">
				<xsl:variable name="files" select="(for $uri in sort(uri-collection('../../data/editions?select=*.xml')) return doc($uri))"/>
					<xsl:for-each select="$files//tei:TEI">
						<xsl:variable name="filename" select="tokenize(base-uri(current()),'/')[last()]"/>
					  <xsl:variable name="id" select="current()//tei:idno[@type='Bruckner_Kopisten']/text()"/>
						<xsl:value-of select="$filename"/>
						<xsl:text>=</xsl:text>
						<xsl:value-of select="$id"/>
						<xsl:text>&#10;</xsl:text>
					</xsl:for-each>
    </xsl:template>
</xsl:stylesheet>
